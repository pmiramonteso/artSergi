import { and, eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import type { CheckoutRequest } from '../../shared/schemas/checkout'
import { isSellable, stripeLocale } from '../../shared/domain/commerce'
import { computeOrderTotals, generateOrderNumber } from '../../shared/domain/order'
import type { Database } from '../database/client'
import {
  inventory,
  orderItems,
  orders,
  products,
  productTranslations,
  productVariants,
} from '../database/schema'
import { releaseReservation, reserveStock } from './inventory'

/** The slice of the Stripe SDK this service uses (easy to fake in tests). */
export interface StripeCheckoutApi {
  checkout: {
    sessions: {
      create(
        params: Stripe.Checkout.SessionCreateParams,
        options?: Stripe.RequestOptions,
      ): Promise<Pick<Stripe.Checkout.Session, 'id' | 'url'>>
      retrieve(id: string): Promise<Pick<Stripe.Checkout.Session, 'id' | 'url' | 'status'>>
    }
  }
}

export class CheckoutError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'NOT_SELLABLE' | 'OUT_OF_STOCK' | 'CONFLICT',
    message: string,
  ) {
    super(message)
    this.name = 'CheckoutError'
  }
}

export interface CheckoutOptions {
  mode: 'test' | 'live'
  origin: string
  shippingCountries: string[]
  idempotencyKey: string
  now?: Date
}

/** Stripe's minimum Checkout lifetime is 30 minutes. */
const SESSION_TTL_MS = 30 * 60_000
/** Stock is held a bit longer than the session, so expiry webhooks always win. */
const RESERVATION_TTL_MS = 35 * 60_000

/**
 * Start a checkout. Everything that matters is decided here, server-side:
 * product, price, currency, stock. Retries with the same idempotency key
 * return the same Stripe session instead of creating a second order.
 */
export async function createCheckout(
  db: Database,
  stripe: StripeCheckoutApi,
  input: CheckoutRequest,
  opts: CheckoutOptions,
): Promise<{ url: string; orderNumber: string }> {
  const now = opts.now ?? new Date()

  // 1 · Idempotent replay.
  const [previous] = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, opts.idempotencyKey))
    .limit(1)
  if (previous) {
    if (previous.stripeCheckoutSessionId) {
      const s = await stripe.checkout.sessions.retrieve(previous.stripeCheckoutSessionId)
      if (s.status === 'open' && s.url) return { url: s.url, orderNumber: previous.number }
    }
    throw new CheckoutError('CONFLICT', 'This checkout attempt was already used')
  }

  // 2 · Catalogue lookup (prices come from the database only).
  const [row] = await db
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productVariants.sku, input.sku))
    .limit(1)
  if (!row) throw new CheckoutError('NOT_FOUND', 'Unknown product')
  const { variant, product } = row
  if (!isSellable(opts.mode, { productActive: product.active, variantActive: variant.active })) {
    throw new CheckoutError('NOT_SELLABLE', 'Product not available')
  }
  const isSubscription = variant.billingInterval !== null
  const quantity = isSubscription ? 1 : input.quantity

  const [tr] = await db
    .select()
    .from(productTranslations)
    .where(
      and(
        eq(productTranslations.productId, product.id),
        eq(productTranslations.locale, input.locale as 'en' | 'es' | 'ca'),
      ),
    )
    .limit(1)
  const [fallback] = tr
    ? [tr]
    : await db
        .select()
        .from(productTranslations)
        .where(eq(productTranslations.productId, product.id))
        .limit(1)
  const title = fallback?.title ?? variant.name

  // Shipping rates are not defined yet (OPEN_QUESTIONS B3) and tax is not
  // configured (B4): both are 0 until the business decides. Live mode is
  // blocked anyway until pricing is validated.
  const totals = computeOrderTotals([{ unitAmount: variant.priceAmount, quantity }])

  // 3 · Order + stock reservation, atomically.
  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        number: generateOrderNumber(now),
        email: 'pending@checkout.invalid', // replaced by the verified Stripe email
        status: 'awaiting_payment',
        locale: input.locale as 'en' | 'es' | 'ca',
        currency: variant.currency,
        ...totals,
        idempotencyKey: opts.idempotencyKey,
      })
      .returning()
    await tx.insert(orderItems).values({
      orderId: created!.id,
      variantId: variant.id,
      titleSnapshot: title,
      quantity,
      unitAmount: variant.priceAmount,
      totalAmount: variant.priceAmount * quantity,
    })
    const [tracked] = await tx
      .select({ variantId: inventory.variantId })
      .from(inventory)
      .where(eq(inventory.variantId, variant.id))
    if (tracked) {
      await reserveStock(tx as unknown as Database, {
        variantId: variant.id,
        quantity,
        reference: created!.id,
        ttlMs: RESERVATION_TTL_MS,
        now,
      })
    }
    return created!
  })

  // 4 · Stripe Checkout session (outside the DB transaction).
  const metadata = { orderId: order.id, orderNumber: order.number }
  const base = `${opts.origin}/${input.locale}/checkout`
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: isSubscription ? 'subscription' : 'payment',
        client_reference_id: order.id,
        locale: stripeLocale(input.locale),
        line_items: [
          variant.stripePriceId
            ? { price: variant.stripePriceId, quantity }
            : {
                quantity,
                price_data: {
                  currency: variant.currency.toLowerCase(),
                  unit_amount: variant.priceAmount,
                  product_data: { name: title },
                  ...(isSubscription
                    ? {
                        recurring: {
                          interval: variant.billingInterval!,
                          interval_count: variant.intervalCount ?? 1,
                        },
                      }
                    : {}),
                },
              },
        ],
        shipping_address_collection: {
          allowed_countries:
            opts.shippingCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
        },
        expires_at: Math.floor((now.getTime() + SESSION_TTL_MS) / 1000),
        success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/cancel`,
        metadata,
        ...(isSubscription
          ? { subscription_data: { metadata: { ...metadata, variantId: variant.id } } }
          : { payment_intent_data: { metadata }, customer_creation: 'always' as const }),
      },
      { idempotencyKey: `checkout-${order.id}` },
    )
    if (!session.url) throw new Error('Stripe returned no checkout URL')
    await db
      .update(orders)
      .set({ stripeCheckoutSessionId: session.id, updatedAt: new Date() })
      .where(eq(orders.id, order.id))
    return { url: session.url, orderNumber: order.number }
  } catch (err) {
    // Never keep stock held for a checkout that could not start.
    await releaseReservation(db, order.id)
    await db
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, order.id))
    throw err
  }
}

import { randomUUID } from 'node:crypto'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { seedDatabase } from '../../server/database/seed'
import {
  inventory,
  orders,
  payments,
  productVariants,
  subscriptions,
  webhookEvents,
} from '../../server/database/schema'
import {
  CheckoutError,
  createCheckout,
  type StripeCheckoutApi,
} from '../../server/services/checkout'
import { processStripeEvent } from '../../server/services/stripe-webhooks'
import { availableQuantity, InsufficientStockError } from '../../server/services/inventory'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

// ── Fakes ────────────────────────────────────────────────────────────────
type Created = { params: Stripe.Checkout.SessionCreateParams; options?: Stripe.RequestOptions }
function fakeStripe() {
  const created: Created[] = []
  let n = 0
  const api: StripeCheckoutApi = {
    checkout: {
      sessions: {
        create: async (params, options) => {
          created.push({ params, options })
          const id = `cs_test_fake${++n}`
          return { id, url: `https://checkout.stripe.test/${id}` }
        },
        retrieve: async (id) => ({ id, url: `https://checkout.stripe.test/${id}`, status: 'open' }),
      },
    },
  }
  return { api, created }
}

/** Real Stripe signature round-trip: sign a payload, verify, parse. */
const stripe = new Stripe('sk_test_dummy')
const WHSEC = 'whsec_test_secret'
async function signedEvent(
  type: string,
  object: Record<string, unknown>,
  id = `evt_${randomUUID()}`,
) {
  const payload = JSON.stringify({ id, object: 'event', type, data: { object } })
  const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: WHSEC })
  return stripe.webhooks.constructEventAsync(payload, header, WHSEC)
}

let db: Database
let close: (() => Promise<void>) | undefined
const origin = 'https://example.com'
const opts = (key = randomUUID()) => ({
  mode: 'test' as const,
  origin,
  shippingCountries: ['ES'],
  idempotencyKey: key,
})

beforeEach(async () => {
  await close?.()
  ;({ db, close } = await createTestDatabase())
  await seedDatabase(db)
})
afterAll(() => close?.())

const singleVariant = async () =>
  (await db.select().from(productVariants).where(eq(productVariants.sku, 'ART-MAIL-SINGLE')))[0]!

// ── Checkout ─────────────────────────────────────────────────────────────
describe('createCheckout', () => {
  it('uses the server price, reserves stock and creates an awaiting order', async () => {
    const { api, created } = fakeStripe()
    const res = await createCheckout(
      db,
      api,
      { sku: 'ART-MAIL-SINGLE', quantity: 2, locale: 'ca' },
      opts(),
    )
    expect(res.url).toMatch(/^https:\/\/checkout\.stripe\.test\//)

    const p = created[0]!.params
    expect(p.mode).toBe('payment')
    expect(p.locale).toBe('auto') // no Catalan in Stripe Checkout
    expect(p.line_items![0]!.price_data!.unit_amount).toBe(990)
    expect(p.line_items![0]!.quantity).toBe(2)
    expect(p.success_url).toBe(`${origin}/ca/checkout/success?session_id={CHECKOUT_SESSION_ID}`)
    expect(created[0]!.options?.idempotencyKey).toMatch(/^checkout-/)

    const [order] = await db.select().from(orders)
    expect(order).toMatchObject({ status: 'awaiting_payment', totalAmount: 1980, currency: 'EUR' })
    expect(await availableQuantity(db, (await singleVariant()).id)).toBe(48)
  })

  it('subscriptions use recurring price data and no stock', async () => {
    const { api, created } = fakeStripe()
    await createCheckout(db, api, { sku: 'ART-MAIL-MONTHLY', quantity: 3, locale: 'en' }, opts())
    const p = created[0]!.params
    expect(p.mode).toBe('subscription')
    expect(p.line_items![0]!.quantity).toBe(1) // forced to 1
    expect(p.line_items![0]!.price_data!.recurring).toEqual({
      interval: 'month',
      interval_count: 1,
    })
    expect(p.subscription_data?.metadata?.orderId).toBeTruthy()
  })

  it('the same idempotency key returns the same session (no second order)', async () => {
    const { api, created } = fakeStripe()
    const o = opts()
    const a = await createCheckout(
      db,
      api,
      { sku: 'ART-MAIL-SINGLE', quantity: 1, locale: 'en' },
      o,
    )
    const b = await createCheckout(
      db,
      api,
      { sku: 'ART-MAIL-SINGLE', quantity: 1, locale: 'en' },
      o,
    )
    expect(b.url).toBe(a.url)
    expect(created).toHaveLength(1)
    expect(await db.select().from(orders)).toHaveLength(1)
  })

  it('live mode refuses products not approved for sale', async () => {
    const { api } = fakeStripe()
    await expect(
      createCheckout(
        db,
        api,
        { sku: 'ART-MAIL-SINGLE', quantity: 1, locale: 'en' },
        { ...opts(), mode: 'live' },
      ),
    ).rejects.toMatchObject({ code: 'NOT_SELLABLE' })
  })

  it('unknown sku → NOT_FOUND; sold out → InsufficientStockError and no order', async () => {
    const { api } = fakeStripe()
    await expect(
      createCheckout(db, api, { sku: 'NOPE', quantity: 1, locale: 'en' }, opts()),
    ).rejects.toBeInstanceOf(CheckoutError)
    await db.update(inventory).set({ quantitySold: 50 })
    await expect(
      createCheckout(db, api, { sku: 'ART-MAIL-SINGLE', quantity: 1, locale: 'en' }, opts()),
    ).rejects.toBeInstanceOf(InsufficientStockError)
    expect(await db.select().from(orders)).toHaveLength(0)
  })

  it('if Stripe fails, the reservation is released and the order cancelled', async () => {
    const failing: StripeCheckoutApi = {
      checkout: {
        sessions: {
          create: async () => {
            throw new Error('network')
          },
          retrieve: async () => {
            throw new Error('n/a')
          },
        },
      },
    }
    await expect(
      createCheckout(db, failing, { sku: 'ART-MAIL-SINGLE', quantity: 1, locale: 'en' }, opts()),
    ).rejects.toThrow('network')
    expect((await db.select().from(orders))[0]!.status).toBe('cancelled')
    expect(await availableQuantity(db, (await singleVariant()).id)).toBe(50)
  })
})

// ── Webhooks ─────────────────────────────────────────────────────────────
async function startCheckout(quantity = 1) {
  const { api } = fakeStripe()
  await createCheckout(db, api, { sku: 'ART-MAIL-SINGLE', quantity, locale: 'es' }, opts())
  const [order] = await db.select().from(orders)
  return order!
}

const paidSession = (
  order: { id: string; stripeCheckoutSessionId: string | null },
  amount: number,
) => ({
  id: order.stripeCheckoutSessionId,
  object: 'checkout.session',
  client_reference_id: order.id,
  payment_status: 'paid',
  amount_total: amount,
  currency: 'eur',
  customer: 'cus_test_1',
  payment_intent: 'pi_test_1',
  customer_details: { email: 'buyer@example.com' },
  collected_information: {
    shipping_details: {
      name: 'Test Buyer',
      address: { line1: 'Carrer 1', city: 'Barcelona', postal_code: '08001', country: 'ES' },
    },
  },
  metadata: {},
})

describe('Stripe webhooks', () => {
  it('rejects a tampered payload (signature check)', async () => {
    const payload = JSON.stringify({
      id: 'evt_x',
      object: 'event',
      type: 'x',
      data: { object: {} },
    })
    const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: WHSEC })
    await expect(
      stripe.webhooks.constructEventAsync(payload.replace('evt_x', 'evt_y'), header, WHSEC),
    ).rejects.toThrow()
    await expect(
      stripe.webhooks.constructEventAsync(payload, header, 'whsec_other'),
    ).rejects.toThrow()
  })

  it('checkout.session.completed → order paid, payment recorded, stock committed', async () => {
    const order = await startCheckout(2)
    const evt = await signedEvent('checkout.session.completed', paidSession(order, 1980))
    expect(await processStripeEvent(db, evt)).toBe('processed')

    const [o] = await db.select().from(orders)
    expect(o).toMatchObject({
      status: 'paid',
      email: 'buyer@example.com',
      stripePaymentIntentId: 'pi_test_1',
    })
    expect(o!.shippingAddress).toMatchObject({ city: 'Barcelona', country: 'ES' })
    expect(await db.select().from(payments)).toHaveLength(1)
    const [inv] = await db.select().from(inventory)
    expect(inv).toMatchObject({ quantitySold: 2, quantityReserved: 0 })
  })

  it('duplicate deliveries are ignored', async () => {
    const order = await startCheckout()
    const evt = await signedEvent('checkout.session.completed', paidSession(order, 990), 'evt_dup')
    expect(await processStripeEvent(db, evt)).toBe('processed')
    expect(await processStripeEvent(db, evt)).toBe('duplicate')
    expect(await db.select().from(payments)).toHaveLength(1)
    expect((await db.select().from(inventory))[0]!.quantitySold).toBe(1)
  })

  it('an amount mismatch never marks the order paid (event marked failed)', async () => {
    const order = await startCheckout()
    const evt = await signedEvent('checkout.session.completed', paidSession(order, 1), 'evt_bad')
    await expect(processStripeEvent(db, evt)).rejects.toThrow(/Amount mismatch/)
    expect((await db.select().from(orders))[0]!.status).toBe('awaiting_payment')
    expect((await db.select().from(webhookEvents))[0]).toMatchObject({
      id: 'evt_bad',
      status: 'failed',
    })
  })

  it('an unpaid completed session (async method) does not mark paid', async () => {
    const order = await startCheckout()
    const evt = await signedEvent('checkout.session.completed', {
      ...paidSession(order, 990),
      payment_status: 'unpaid',
    })
    await processStripeEvent(db, evt)
    expect((await db.select().from(orders))[0]!.status).toBe('awaiting_payment')
  })

  it('checkout.session.expired → order cancelled and stock released', async () => {
    const order = await startCheckout(3)
    const evt = await signedEvent('checkout.session.expired', {
      ...paidSession(order, 2970),
      payment_status: 'unpaid',
    })
    await processStripeEvent(db, evt)
    expect((await db.select().from(orders))[0]!.status).toBe('cancelled')
    expect(await availableQuantity(db, (await singleVariant()).id)).toBe(50)
  })

  it('charge.refunded updates payment and order', async () => {
    const order = await startCheckout()
    await processStripeEvent(
      db,
      await signedEvent('checkout.session.completed', paidSession(order, 990)),
    )
    await processStripeEvent(
      db,
      await signedEvent('charge.refunded', {
        object: 'charge',
        payment_intent: 'pi_test_1',
        amount: 990,
        amount_refunded: 500,
        currency: 'eur',
      }),
    )
    expect((await db.select().from(payments))[0]).toMatchObject({
      status: 'partially_refunded',
      refundedAmount: 500,
    })
    expect((await db.select().from(orders))[0]!.status).toBe('partially_refunded')
  })

  it('subscriptions: created, then out-of-order events cannot resurrect a canceled one', async () => {
    const { api } = fakeStripe()
    await createCheckout(db, api, { sku: 'ART-MAIL-MONTHLY', quantity: 1, locale: 'en' }, opts())
    const [order] = await db.select().from(orders)
    const sub = (status: string) => ({
      id: 'sub_test_1',
      object: 'subscription',
      customer: 'cus_test_9',
      status,
      cancel_at_period_end: false,
      metadata: { orderId: order!.id },
      items: {
        data: [
          {
            current_period_start: 1_767_225_600,
            current_period_end: 1_769_904_000,
            price: { id: 'price_test_1' },
          },
        ],
      },
    })
    await processStripeEvent(db, await signedEvent('customer.subscription.created', sub('active')))
    await processStripeEvent(
      db,
      await signedEvent('customer.subscription.deleted', sub('canceled')),
    )
    await processStripeEvent(db, await signedEvent('customer.subscription.updated', sub('active')))
    const [s] = await db.select().from(subscriptions)
    expect(s).toMatchObject({ status: 'canceled', priceId: 'price_test_1' })
    expect(s!.currentPeriodEnd?.toISOString()).toBe('2026-02-01T00:00:00.000Z')
  })

  it('ignores event types it does not handle', async () => {
    expect(
      await processStripeEvent(db, await signedEvent('customer.created', { object: 'customer' })),
    ).toBe('ignored')
    expect(await db.select().from(webhookEvents)).toHaveLength(0)
  })
})

import { randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type Stripe from 'stripe'
import { applyStatus, type SubscriptionStatus } from '../../shared/domain/subscription'
import type { Database } from '../database/client'
import { customers, orders, payments, subscriptions, webhookEvents } from '../database/schema'
import { isDuplicateKey } from '../database/result'
import { commitReservation, releaseReservation } from './inventory'

/**
 * Stripe webhook processing. Called ONLY after the signature was verified.
 *
 * - Idempotent: each event id is recorded; processed events are skipped,
 *   failed ones may be retried by Stripe.
 * - Never trusts the browser: orders become "paid" only here (or via the
 *   server-side reconciliation, which reads the session from Stripe).
 * - Verifies the amount Stripe charged equals the order total.
 */
export type WebhookOutcome = 'processed' | 'duplicate' | 'ignored'

const HANDLED = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'charge.refunded',
])

export async function processStripeEvent(
  db: Database,
  event: Stripe.Event,
): Promise<WebhookOutcome> {
  if (!HANDLED.has(event.type)) return 'ignored'

  // Claim the event id: the primary key rejects a second delivery.
  let claimed = true
  try {
    await db.insert(webhookEvents).values({ id: event.id, type: event.type })
  } catch (err) {
    if (!isDuplicateKey(err)) throw err
    claimed = false
  }
  if (!claimed) {
    const [existing] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, event.id))
    if (existing?.status === 'processed') return 'duplicate'
    // 'received' (crashed mid-way) or 'failed': process again.
  }

  try {
    await db.transaction(async (tx) => {
      await handle(tx as unknown as Database, event)
      await tx
        .update(webhookEvents)
        .set({ status: 'processed', processedAt: new Date(), error: null })
        .where(eq(webhookEvents.id, event.id))
    })
    return 'processed'
  } catch (err) {
    await db
      .update(webhookEvents)
      .set({ status: 'failed', error: String((err as Error).message).slice(0, 500) })
      .where(eq(webhookEvents.id, event.id))
    throw err
  }
}

async function handle(db: Database, event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        await markSessionPaid(db, session)
      }
      return
    }
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      await cancelSessionOrder(db, event.data.object)
      return
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await upsertSubscription(db, event.data.object)
      return
    case 'charge.refunded':
      await recordRefund(db, event.data.object)
  }
}

const idOf = (v: string | { id: string } | null | undefined) =>
  typeof v === 'string' ? v : (v?.id ?? null)

async function findSessionOrder(db: Database, session: Stripe.Checkout.Session) {
  const orderId = session.client_reference_id ?? session.metadata?.orderId
  if (!orderId) throw new Error(`Session ${session.id} has no order reference`)
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error(`Order not found for session ${session.id}`)
  return order
}

/** Shared by the webhook and server-side reconciliation. Idempotent. */
export async function markSessionPaid(db: Database, session: Stripe.Checkout.Session) {
  const order = await findSessionOrder(db, session)
  if (order.status === 'paid' || order.status === 'fulfilled' || order.status === 'shipped') return

  if (
    session.amount_total !== order.totalAmount ||
    (session.currency ?? '').toUpperCase() !== order.currency
  ) {
    throw new Error(`Amount mismatch for order ${order.number}`)
  }

  const email = session.customer_details?.email ?? order.email
  const stripeCustomerId = idOf(session.customer)
  const customerId = await upsertCustomer(db, { email, stripeCustomerId, locale: order.locale })
  const address = session.collected_information?.shipping_details?.address

  await db
    .update(orders)
    .set({
      status: 'paid',
      email,
      customerId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: idOf(session.payment_intent),
      shippingAddress: address
        ? {
            name: session.collected_information?.shipping_details?.name ?? '',
            line1: address.line1 ?? '',
            line2: address.line2,
            city: address.city ?? '',
            postalCode: address.postal_code ?? '',
            region: address.state,
            country: address.country ?? '',
          }
        : order.shippingAddress,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))

  await db
    .insert(payments)
    .values({
      orderId: order.id,
      providerPaymentId: idOf(session.payment_intent) ?? idOf(session.invoice) ?? session.id,
      status: 'succeeded',
      amount: session.amount_total ?? 0,
      currency: order.currency,
    })
    .onDuplicateKeyUpdate({ set: { id: sql`id` } })

  await commitReservation(db, order.id)
}

async function cancelSessionOrder(db: Database, session: Stripe.Checkout.Session) {
  const order = await findSessionOrder(db, session)
  if (order.status !== 'awaiting_payment' && order.status !== 'pending') return
  await db
    .update(orders)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(orders.id, order.id))
  await releaseReservation(db, order.id)
}

async function upsertCustomer(
  db: Database,
  c: { email: string; stripeCustomerId: string | null; locale: 'en' | 'es' | 'ca' },
): Promise<string> {
  if (c.stripeCustomerId) {
    const [found] = await db
      .select()
      .from(customers)
      .where(eq(customers.stripeCustomerId, c.stripeCustomerId))
      .limit(1)
    if (found) return found.id
  }
  const id = randomUUID()
  await db
    .insert(customers)
    .values({ id, email: c.email, stripeCustomerId: c.stripeCustomerId, locale: c.locale })
    .onDuplicateKeyUpdate({ set: { email: c.email } })
  if (!c.stripeCustomerId) return id
  // A concurrent insert may have won the unique key: read the real row id.
  const [row] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.stripeCustomerId, c.stripeCustomerId))
  return row!.id
}

async function upsertSubscription(db: Database, sub: Stripe.Subscription) {
  const orderId = sub.metadata?.orderId
  const stripeCustomerId = idOf(sub.customer)!
  const [order] = orderId ? await db.select().from(orders).where(eq(orders.id, orderId)) : []
  const customerId = await upsertCustomer(db, {
    email: order?.email ?? 'pending@checkout.invalid',
    stripeCustomerId,
    locale: order?.locale ?? 'en',
  })

  const item = sub.items.data[0]
  const incoming = sub.status as SubscriptionStatus
  const period = item
    ? {
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
      }
    : {}

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1)

  if (!existing) {
    await db.insert(subscriptions).values({
      customerId,
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      status: incoming,
      priceId: item?.price.id ?? 'unknown',
      variantId: sub.metadata?.variantId ?? null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      ...period,
    })
    return
  }

  // Out-of-order deliveries: only valid transitions are applied.
  const status = applyStatus(existing.status, incoming)
  await db
    .update(subscriptions)
    .set({
      status,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      ...(status === incoming ? period : {}),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existing.id))
}

async function recordRefund(db: Database, charge: Stripe.Charge) {
  const paymentIntentId = idOf(charge.payment_intent)
  if (!paymentIntentId) return
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerPaymentId, paymentIntentId))
    .limit(1)
  if (!payment) return
  const full = charge.amount_refunded >= payment.amount
  await db
    .update(payments)
    .set({
      refundedAmount: Math.min(charge.amount_refunded, payment.amount),
      status: full ? 'refunded' : 'partially_refunded',
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))
  await db
    .update(orders)
    .set({ status: full ? 'refunded' : 'partially_refunded', updatedAt: new Date() })
    .where(
      and(
        eq(orders.id, payment.orderId),
        inArray(orders.status, ['paid', 'fulfilled', 'shipped', 'delivered', 'partially_refunded']),
      ),
    )
}

/** Public status for the success page. */
export async function orderStatusBySession(db: Database, sessionId: string) {
  const [order] = await db
    .select({ number: orders.number, status: orders.status })
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
    .limit(1)
  return order ?? null
}

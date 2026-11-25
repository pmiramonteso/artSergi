import { checkoutStatusQuerySchema, type CheckoutStatus } from '#shared/schemas/checkout'
import { markSessionPaid, orderStatusBySession } from '../../services/stripe-webhooks'

/**
 * GET /api/checkout/status?session_id=cs_…  (used by the success page)
 *
 * The browser redirect proves nothing, so this reads OUR database. If the
 * webhook has not arrived yet, it reconciles by asking Stripe directly
 * (server-to-server, authenticated), using the same idempotent logic as
 * the webhook. Returns no personal data and no amounts.
 */
export default defineEventHandler(async (event): Promise<CheckoutStatus> => {
  const { stripe, db } = requireCommerce(event)
  const q = await getValidatedQuery(event, (x) => checkoutStatusQuerySchema.safeParse(x))
  if (!q.success) throw createError({ statusCode: 400, statusMessage: 'Invalid session' })
  setResponseHeader(event, 'Cache-Control', 'no-store')

  let order = await orderStatusBySession(db, q.data.session_id)
  if (!order) return { status: 'unknown', orderNumber: null }

  if (order.status === 'awaiting_payment') {
    const session = await stripe.checkout.sessions.retrieve(q.data.session_id)
    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
      await markSessionPaid(db, session)
      order = await orderStatusBySession(db, q.data.session_id)
    }
  }

  const s = order!.status
  const status =
    s === 'cancelled'
      ? 'cancelled'
      : s === 'awaiting_payment' || s === 'pending'
        ? 'pending'
        : 'paid'
  return { status, orderNumber: order!.number }
})

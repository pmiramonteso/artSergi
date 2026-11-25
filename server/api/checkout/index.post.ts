import { checkoutRequestSchema, idempotencyKeySchema } from '#shared/schemas/checkout'
import { CheckoutError, createCheckout } from '../../services/checkout'
import { InsufficientStockError } from '../../services/inventory'

/**
 * POST /api/checkout  { sku, quantity?, locale? } + header Idempotency-Key
 * → { url } of a Stripe Checkout session. Prices are never accepted from
 * the client. Disabled (503) unless commerce is configured.
 */
export default defineEventHandler(async (event) => {
  await hitRateLimit(event, `checkout:${clientIp(event)}`, { limit: 10, windowMs: 10 * 60_000 })

  const { stripe, db, mode } = requireCommerce(event)

  const key = idempotencyKeySchema.safeParse(getRequestHeader(event, 'idempotency-key'))
  if (!key.success) throw createError({ statusCode: 400, statusMessage: 'Missing Idempotency-Key' })
  const body = await readValidatedBody(event, (b) => checkoutRequestSchema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'Invalid checkout data' })

  try {
    return await createCheckout(db, stripe, body.data, {
      mode,
      origin: siteOrigin(event),
      shippingCountries: shippingCountries(event),
      idempotencyKey: key.data,
    })
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      throw createError({ statusCode: 409, statusMessage: 'Sold out', data: { code: 'SOLD_OUT' } })
    }
    if (err instanceof CheckoutError) {
      const status = err.code === 'CONFLICT' ? 409 : 404
      throw createError({
        statusCode: status,
        statusMessage: err.message,
        data: { code: err.code },
      })
    }
    if ((err as { code?: string }).code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Duplicate checkout attempt' })
    }
    console.error('[checkout] failed to create session', (err as Error).message)
    throw createError({ statusCode: 502, statusMessage: 'Payment provider unavailable' })
  }
})

import { processStripeEvent } from '../../services/stripe-webhooks'

/**
 * POST /api/webhooks/stripe: Stripe → server only.
 * The signature is verified on the RAW body with the endpoint secret before
 * anything is parsed or trusted. Errors return 5xx so Stripe retries.
 */
export default defineEventHandler(async (event) => {
  const { stripe, db } = requireCommerce(event)
  const signature = getRequestHeader(event, 'stripe-signature')
  const raw = await readRawBody(event, false)
  if (!signature || !raw) throw createError({ statusCode: 400, statusMessage: 'Bad request' })

  let stripeEvent
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(
      raw,
      signature,
      String(useRuntimeConfig(event).stripeWebhookSecret),
    )
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  const outcome = await processStripeEvent(db, stripeEvent)
  return { received: true, outcome }
})

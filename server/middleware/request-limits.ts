/**
 * Reject oversized request bodies early (DoS hygiene). Stripe webhooks can
 * be larger than ordinary form posts, so they get a higher ceiling.
 */
const DEFAULT_LIMIT = 64 * 1024
const WEBHOOK_LIMIT = 1024 * 1024

export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return
  const limit = event.path.startsWith('/api/webhooks/') ? WEBHOOK_LIMIT : DEFAULT_LIMIT
  const length = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (length > limit) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large' })
  }
})

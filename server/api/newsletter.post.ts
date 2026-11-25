import { looksAutomated, newsletterSignupSchema } from '#shared/schemas/newsletter'
import type { NewsletterResult } from '#shared/schemas/newsletter'
import { createRateLimiter } from '../utils/rate-limit'

// 5 attempts per IP per 10 minutes (single-process store; see rate-limit.ts).
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 })

/**
 * Newsletter sign-up.
 *
 * No email provider is connected yet (that needs explicit configuration and
 * a privacy review). Until then valid requests get a clear 503 "opens soon"
 * answer: the address is NOT stored or logged anywhere.
 */
export default defineEventHandler(async (event): Promise<NewsletterResult> => {
  const { newsletterProvider, trustProxy } = useRuntimeConfig(event)
  const ip = getRequestIP(event, { xForwardedFor: trustProxy === true }) ?? 'unknown'
  const rate = limiter.hit(`newsletter:${ip}`)
  if (!rate.allowed) {
    setResponseHeader(event, 'Retry-After', rate.retryAfter)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const parsed = await readValidatedBody(event, (body) => newsletterSignupSchema.safeParse(body))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid sign-up data',
      data: { fields: parsed.error.issues.map((i) => i.path.join('.')) },
    })
  }

  if (!newsletterProvider) {
    setResponseStatus(event, 503)
    return {
      status: 'unavailable',
      message: 'Newsletter sign-up opens soon. Nothing was stored.',
    }
  }

  // Bots get the same answer as a real sign-up so they learn nothing; nothing is stored.
  if (looksAutomated(parsed.data)) {
    return { status: 'subscribed' }
  }

  // A provider integration will be added here once configured and approved.
  throw createError({ statusCode: 501, statusMessage: 'Newsletter provider not implemented' })
})

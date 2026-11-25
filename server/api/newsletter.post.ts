import { looksAutomated, newsletterSignupSchema } from '#shared/schemas/newsletter'
import type { NewsletterResult } from '#shared/schemas/newsletter'

/**
 * Newsletter sign-up.
 *
 * No email provider is connected yet (that needs explicit configuration and
 * a privacy review). Until then valid requests get a clear 503 "opens soon"
 * answer: the address is NOT stored or logged anywhere.
 */
export default defineEventHandler(async (event): Promise<NewsletterResult> => {
  const { newsletterProvider } = useRuntimeConfig(event)
  await hitRateLimit(event, `newsletter:${clientIp(event)}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  })

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

import { z } from 'zod'

/** Minimum time a human needs to fill the form (anti-bot timing check). */
export const NEWSLETTER_MIN_FILL_MS = 2000

export const newsletterSignupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  /** Explicit, unticked-by-default consent is required (GDPR). */
  consent: z.literal(true),
  locale: z.enum(['en', 'es', 'ca']).default('en'),
  /** Honeypot: hidden from humans, must stay empty. */
  website: z.string().max(200).default(''),
  /** Milliseconds between form render and submit, measured client-side. */
  elapsedMs: z.number().int().nonnegative().max(86_400_000),
})

export type NewsletterSignup = z.infer<typeof newsletterSignupSchema>

/** Bot heuristics: filled honeypot or impossibly fast submission. */
export function looksAutomated(input: Pick<NewsletterSignup, 'website' | 'elapsedMs'>): boolean {
  return input.website.trim() !== '' || input.elapsedMs < NEWSLETTER_MIN_FILL_MS
}

export type NewsletterResult = { status: 'subscribed' } | { status: 'unavailable'; message: string }

import { z } from 'zod'

const siteUrlSchema = z
  .url({ protocol: /^https?$/, hostname: z.regexes.domain })
  .or(z.url({ protocol: /^https?$/, hostname: /^localhost$/ }))

/**
 * Validates a configured site origin and returns it without a trailing slash.
 * Returns `null` when the value is empty or invalid, so callers can decide
 * whether to fall back (e.g. to the request host in development).
 */
export function normalizeSiteUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = siteUrlSchema.safeParse(value.trim())
  if (!parsed.success) return null
  const url = new URL(parsed.data)
  return `${url.protocol}//${url.host}`
}

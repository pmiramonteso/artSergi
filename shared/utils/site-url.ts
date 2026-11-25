/**
 * Validates a configured site origin and returns it without a trailing slash.
 * Returns `null` when the value is empty or invalid, so callers can decide
 * whether to fall back (e.g. to the request host in development).
 *
 * Uses the native URL parser (no validation library): this runs in the
 * browser too, and pulling Zod into the client bundle cost ~60 KB.
 */
const DOMAIN = /^(?=.{1,253}$)(?:(?!-)[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/i

export function normalizeSiteUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password) return null
  if (url.hostname !== 'localhost' && !DOMAIN.test(url.hostname)) return null
  return `${url.protocol}//${url.host}`
}

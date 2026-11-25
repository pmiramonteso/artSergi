import { createAuthClient } from 'better-auth/vue'
import { adminClient, twoFactorClient } from 'better-auth/client/plugins'

/** Browser auth client (same origin, cookie-based; tokens never in JS). */
export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [twoFactorClient(), adminClient()],
})

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeRedirect(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback
}

export function authErrorKey(err: { status?: number; code?: string } | null | undefined): string {
  if (!err) return 'account.errors.generic'
  if (err.status === 429) return 'account.errors.tooMany'
  if (err.code === 'EMAIL_NOT_VERIFIED' || err.status === 403) return 'account.errors.unverified'
  if (err.status === 401 || err.code === 'INVALID_EMAIL_OR_PASSWORD')
    return 'account.errors.credentials'
  return 'account.errors.generic'
}

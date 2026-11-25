import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins/admin'
import { twoFactor } from 'better-auth/plugins/two-factor'
import type { H3Event } from 'h3'
import { normalizeSiteUrl } from '../../shared/utils/site-url'
import {
  accounts,
  rateLimits,
  sessions,
  twoFactors,
  users,
  verifications,
} from '../database/schema'
import type { Database } from '../database/client'
import { mails } from './mail-templates'

/**
 * Authentication (Better Auth): email + password (scrypt hashing), required
 * email verification, password reset (revokes all sessions), DB-backed
 * sessions (30 days, refreshed daily, revocable), TOTP 2FA with backup codes,
 * roles, account deletion, and DB-backed rate limiting.
 */
export function createAuth(
  db: Database,
  opts: {
    baseURL: string
    secret: string
    secure: boolean
    /** Header carrying the real client IP behind our proxy ('' = TCP peer). */
    clientIpHeader: '' | 'cf-connecting-ip' | 'x-real-ip' | 'x-forwarded-for'
    send: (mail: { to: string; subject: string; text: string }) => Promise<void>
  },
) {
  return betterAuth({
    appName: 'Sergi Tugas Art Studio',
    baseURL: opts.baseURL,
    basePath: '/api/auth',
    secret: opts.secret,
    trustedOrigins: [opts.baseURL],
    database: drizzleAdapter(db, {
      provider: 'mysql',
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        twoFactor: twoFactors,
        rateLimit: rateLimits,
      },
    }),
    advanced: {
      database: { generateId: 'uuid' },
      useSecureCookies: opts.secure,
      cookiePrefix: 'st',
      ipAddress: { ipAddressHeaders: opts.clientIpHeader ? [opts.clientIpHeader] : [] },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await opts.send({ to: user.email, ...mails.reset(url) })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 24 * 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        await opts.send({ to: user.email, ...mails.verify(url) })
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 10,
    },
    user: { deleteUser: { enabled: true } },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 60,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 300, max: 5 },
        '/request-password-reset': { window: 300, max: 3 },
        '/send-verification-email': { window: 300, max: 3 },
        '/two-factor/verify-totp': { window: 60, max: 5 },
        '/two-factor/verify-backup-code': { window: 60, max: 5 },
      },
    },
    plugins: [
      twoFactor({ issuer: 'Sergi Tugas Art Studio' }),
      admin({ defaultRole: 'user', adminRoles: ['admin'] }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>

let instance: { key: string; auth: Auth } | undefined

/** Auth for this process, or null when there is no database / secret. */
export function useAuth(event: H3Event): Auth | null {
  const db = useDatabase()
  const c = useRuntimeConfig(event)
  const secret = String(c.authSecret ?? '')
  if (!db || secret.length < 32) return null
  const baseURL = normalizeSiteUrl(c.public.siteUrl) ?? getRequestURL(event).origin
  const key = `${baseURL}|${secret.length}`
  if (!instance || instance.key !== key) {
    instance = {
      key,
      auth: createAuth(db, {
        baseURL,
        secret,
        secure: baseURL.startsWith('https://'),
        clientIpHeader: clientIpHeader(event),
        send: sendMail,
      }),
    }
  }
  return instance.auth
}

export function requireAuth(event: H3Event): Auth {
  const auth = useAuth(event)
  if (!auth) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Accounts are not available',
      data: { code: 'AUTH_DISABLED' },
    })
  }
  return auth
}

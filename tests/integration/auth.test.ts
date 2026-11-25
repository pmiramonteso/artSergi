import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { base32 } from '@better-auth/utils/base32'
import { createOTP } from '@better-auth/utils/otp'
import { createAuth, type Auth } from '../../server/utils/auth'
import { accounts, sessions, users } from '../../server/database/schema'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

const BASE = 'http://localhost:3000'
let db: Database
let close: () => Promise<void>
let auth: Auth
const outbox: Array<{ to: string; subject: string; text: string }> = []

beforeAll(async () => {
  ;({ db, close } = await createTestDatabase())
  auth = createAuth(db, {
    baseURL: BASE,
    secret: 'test-secret-test-secret-test-secret-123',
    secure: false,
    // Distinguish simulated client IPs via X-Forwarded-For.
    trustProxy: true,
    send: async (m) => {
      outbox.push(m)
    },
  })
})
afterAll(() => close())

const linkFrom = (text: string) => text.match(/https?:\/\/\S+/)![0]
const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: BASE },
  body: JSON.stringify(body),
})
const call = (path: string, init: RequestInit = {}) =>
  auth.handler(new Request(`${BASE}/api/auth${path}`, init))
const cookieOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')

describe('accounts', () => {
  const email = 'collector@example.com'
  const password = 'correct horse battery staple'

  it('sign-up stores a hash (never the password) and requires email verification', async () => {
    const res = await call('/sign-up/email', json({ email, password, name: 'Collector' }))
    expect(res.status).toBe(200)
    const [acc] = await db.select().from(accounts)
    expect(acc!.password).toBeTruthy()
    expect(acc!.password).not.toContain(password)

    const signIn = await call('/sign-in/email', json({ email, password }))
    expect(signIn.status).toBe(403) // not verified yet
    expect(outbox.at(-1)!.subject).toMatch(/Confirm your email/)
  })

  it('rejects short passwords', async () => {
    const res = await call(
      '/sign-up/email',
      json({ email: 'x@example.com', password: 'short', name: 'X' }),
    )
    expect(res.status).toBe(400)
  })

  it('verification link activates the account; then sign-in works', async () => {
    const verify = await call(
      new URL(linkFrom(outbox.at(-1)!.text)).pathname.replace('/api/auth', '') +
        new URL(linkFrom(outbox.at(-1)!.text)).search,
    )
    expect([200, 302]).toContain(verify.status)
    const [u] = await db.select().from(users).where(eq(users.email, email))
    expect(u!.emailVerified).toBe(true)
    const signIn = await call('/sign-in/email', json({ email, password }))
    expect(signIn.status).toBe(200)
    expect(cookieOf(signIn)).toMatch(/st\.session_token=/)
  })

  it('wrong password fails; repeated attempts are rate limited', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 7; i++) {
      const r = await call('/sign-in/email', {
        ...json({ email, password: 'wrong password!!' }),
        headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': '9.9.9.9' },
      })
      statuses.push(r.status)
    }
    expect(statuses[0]).toBe(401)
    expect(statuses).toContain(429)
  })

  it('sign-out invalidates the session server-side', async () => {
    const signIn = await call('/sign-in/email', {
      ...json({ email, password }),
      headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': '1.2.3.4' },
    })
    const cookie = cookieOf(signIn)
    const before = await auth.api.getSession({ headers: new Headers({ cookie }) })
    expect(before?.user.email).toBe(email)
    await call('/sign-out', { method: 'POST', headers: { cookie, origin: BASE } })
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull()
  })

  it('password reset revokes every existing session', async () => {
    const signIn = await call('/sign-in/email', {
      ...json({ email, password }),
      headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': '1.2.3.5' },
    })
    const cookie = cookieOf(signIn)
    await call(
      '/request-password-reset',
      json({ email, redirectTo: `${BASE}/en/account/reset-password` }),
    )
    const link = new URL(linkFrom(outbox.at(-1)!.text))
    const token = link.pathname.split('/').pop()!
    const reset = await call(
      '/reset-password',
      json({ token, newPassword: 'a whole new passphrase' }),
    )
    expect(reset.status).toBe(200)
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull()
  })

  it('TOTP two-factor: enable, then sign-in needs a valid code', async () => {
    const pw = 'a whole new passphrase'
    const signIn = await call('/sign-in/email', {
      ...json({ email, password: pw }),
      headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': '1.2.3.6' },
    })
    const cookie = cookieOf(signIn)
    const enable = await call('/two-factor/enable', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: BASE, cookie },
      body: JSON.stringify({ password: pw }),
    })
    expect(enable.status).toBe(200)
    const { totpURI, backupCodes } = (await enable.json()) as {
      totpURI: string
      backupCodes: string[]
    }
    expect(backupCodes.length).toBeGreaterThan(5)
    const secret = new URL(totpURI).searchParams.get('secret')!
    const code = await createOTP(base32.decode(secret)).totp()
    const verify = await call('/two-factor/verify-totp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: BASE, cookie },
      body: JSON.stringify({ code }),
    })
    expect(verify.status).toBe(200)
    expect((await db.select().from(users).where(eq(users.email, email)))[0]!.twoFactorEnabled).toBe(
      true,
    )

    // A fresh password sign-in no longer yields a session by itself.
    const second = await call('/sign-in/email', {
      ...json({ email, password: pw }),
      headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': '1.2.3.7' },
    })
    const body = (await second.json()) as { twoFactorRedirect?: boolean }
    expect(body.twoFactorRedirect).toBe(true)
    expect(cookieOf(second)).not.toMatch(/st\.session_token=[^;]+/)
  })

  it('sessions are stored server-side (revocable), tokens are not the user id', async () => {
    const rows = await db.select().from(sessions)
    for (const s of rows) expect(s.token).not.toBe(s.userId)
  })
})

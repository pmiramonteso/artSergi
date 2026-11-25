import { describe, expect, it } from 'vitest'
import {
  looksAutomated,
  NEWSLETTER_MIN_FILL_MS,
  newsletterSignupSchema,
} from '../../shared/schemas/newsletter'

const valid = { email: ' Name@Example.com ', consent: true, elapsedMs: 5000 }

describe('newsletter schema', () => {
  it('accepts and normalises a valid sign-up', () => {
    const r = newsletterSignupSchema.parse(valid)
    expect(r.email).toBe('name@example.com')
    expect(r.locale).toBe('en')
    expect(r.website).toBe('')
  })

  it.each([
    ['invalid email', { ...valid, email: 'not-an-email' }],
    ['missing consent', { ...valid, consent: false }],
    ['consent as string', { ...valid, consent: 'true' }],
    ['unknown locale', { ...valid, locale: 'fr' }],
    ['negative timing', { ...valid, elapsedMs: -1 }],
    ['too long email', { ...valid, email: `${'a'.repeat(250)}@x.com` }],
    ['not an object', 'email@x.com'],
  ])('rejects %s', (_, input) => {
    expect(newsletterSignupSchema.safeParse(input).success).toBe(false)
  })
})

describe('bot heuristics', () => {
  it('flags a filled honeypot or a too-fast submission', () => {
    expect(looksAutomated({ website: 'spam.example', elapsedMs: 9000 })).toBe(true)
    expect(looksAutomated({ website: '', elapsedMs: NEWSLETTER_MIN_FILL_MS - 1 })).toBe(true)
    expect(looksAutomated({ website: '', elapsedMs: NEWSLETTER_MIN_FILL_MS })).toBe(false)
  })
})

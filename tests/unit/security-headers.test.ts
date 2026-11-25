import { describe, expect, it } from 'vitest'
import {
  addNonce,
  baseSecurityHeaders,
  contentSecurityPolicy,
} from '../../shared/utils/security-headers'

describe('Content-Security-Policy', () => {
  const csp = contentSecurityPolicy('abc123', { upgradeInsecure: true })
  it('never allows unsafe-inline or unsafe-eval for scripts', () => {
    const script = csp.split('; ').find((d) => d.startsWith('script-src'))!
    expect(script).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'")
    expect(csp).not.toContain('unsafe-eval')
  })
  it('blocks framing, plugins and base-tag hijacking', () => {
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain('upgrade-insecure-requests')
  })
})

describe('base headers', () => {
  it('sets the standard hardening headers; HSTS only on https', () => {
    const h = baseSecurityHeaders({ https: true })
    expect(h['X-Content-Type-Options']).toBe('nosniff')
    expect(h['X-Frame-Options']).toBe('DENY')
    expect(h['Strict-Transport-Security']).toMatch(/max-age=31536000/)
    expect(baseSecurityHeaders({ https: false })).not.toHaveProperty('Strict-Transport-Security')
  })
})

describe('addNonce', () => {
  it('adds the nonce to script and style tags, once', () => {
    const html =
      '<script>a()</script><script type="module" src="/x.js"></script><style>.a{}</style><script nonce="n">b()</script>'
    const out = addNonce(html, 'N')
    expect(out.match(/nonce="N"/g)).toHaveLength(3)
    expect(out).toContain('<script nonce="n">b()</script>')
  })
})

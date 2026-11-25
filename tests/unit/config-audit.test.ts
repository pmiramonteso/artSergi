import { describe, expect, it } from 'vitest'
import { auditConfig } from '../../shared/utils/config-audit'

const ok = {
  siteUrl: 'https://example.com',
  siteIndexable: true,
  databaseUrl: 'mysql://x',
  authSecret: 'x'.repeat(40),
  smtpUrl: 'smtps://x',
  commerceMode: 'off',
  publicCommerceMode: 'off',
  stripeSecretKey: '',
  clientIpHeader: 'cf-connecting-ip',
}

describe('auditConfig', () => {
  it('a complete production config has no issues', () => {
    expect(auditConfig(ok)).toEqual([])
  })
  it('refuses to index a non-https site and weak auth secrets', () => {
    expect(
      auditConfig({ ...ok, siteUrl: 'http://example.com' }).some((i) => i.level === 'fatal'),
    ).toBe(true)
    expect(auditConfig({ ...ok, authSecret: 'short' }).some((i) => i.level === 'fatal')).toBe(true)
  })
  it('warns about risky combinations without leaking secrets', () => {
    const issues = auditConfig({
      ...ok,
      commerceMode: 'test',
      publicCommerceMode: 'test',
      stripeSecretKey: 'sk_live_SECRET',
      smtpUrl: '',
    })
    expect(issues.map((i) => i.message).join(' ')).not.toContain('SECRET')
    expect(issues.length).toBeGreaterThanOrEqual(3)
  })
})

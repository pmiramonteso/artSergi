import { describe, expect, it } from 'vitest'
import { normalizeClientIpHeader, resolveClientIp } from '../../shared/utils/client-ip'

describe('client IP (anti-spoofing)', () => {
  it('ignores headers unless configured', () => {
    expect(resolveClientIp('', '6.6.6.6', '10.0.0.1')).toBe('10.0.0.1')
  })
  it('uses the LAST X-Forwarded-For hop, never the client-supplied first one', () => {
    expect(resolveClientIp('x-forwarded-for', '6.6.6.6, 203.0.113.9', '10.0.0.1')).toBe(
      '203.0.113.9',
    )
  })
  it('uses Cloudflare’s single-value header', () => {
    expect(resolveClientIp('cf-connecting-ip', '198.51.100.7', '10.0.0.1')).toBe('198.51.100.7')
  })
  it('rejects garbage and falls back to the peer', () => {
    expect(resolveClientIp('x-real-ip', '<script>', '10.0.0.1')).toBe('10.0.0.1')
    expect(resolveClientIp('x-real-ip', '', null)).toBe('unknown')
  })
  it('normalizes configuration', () => {
    expect(normalizeClientIpHeader('CF-Connecting-IP')).toBe('cf-connecting-ip')
    expect(normalizeClientIpHeader('true')).toBe('')
  })
})

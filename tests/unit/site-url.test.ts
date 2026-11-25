import { describe, expect, it } from 'vitest'
import { normalizeSiteUrl } from '../../shared/utils/site-url'

describe('normalizeSiteUrl', () => {
  it('returns the origin without trailing slash', () => {
    expect(normalizeSiteUrl('https://example.com/')).toBe('https://example.com')
    expect(normalizeSiteUrl('https://example.com/some/path?q=1')).toBe('https://example.com')
  })

  it('keeps ports and allows localhost', () => {
    expect(normalizeSiteUrl('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('rejects empty, non-string and non-http values', () => {
    expect(normalizeSiteUrl('')).toBeNull()
    expect(normalizeSiteUrl('   ')).toBeNull()
    expect(normalizeSiteUrl(undefined)).toBeNull()
    expect(normalizeSiteUrl(42)).toBeNull()
    expect(normalizeSiteUrl('ftp://example.com')).toBeNull()
    expect(normalizeSiteUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeSiteUrl('not a url')).toBeNull()
  })
})

describe('normalizeSiteUrl hardening', () => {
  it('rejects credentials, IP-like or malformed hosts', () => {
    expect(normalizeSiteUrl('https://user:pass@example.com')).toBeNull()
    expect(normalizeSiteUrl('https://-bad-.com')).toBeNull()
    expect(normalizeSiteUrl('https://example')).toBeNull()
  })
  it('keeps real domains and subdomains', () => {
    expect(normalizeSiteUrl('https://www.sergi-tugas.example.co.uk/')).toBe(
      'https://www.sergi-tugas.example.co.uk',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { artMailOffers, formatPrice, PRICING_PUBLISHED } from '../../shared/constants/products'

describe('offers', () => {
  it('stores prices as integer cents with unique ids', () => {
    expect(new Set(artMailOffers.map((o) => o.id)).size).toBe(artMailOffers.length)
    for (const o of artMailOffers) expect(Number.isInteger(o.amount)).toBe(true)
  })

  it('keeps the unvalidated hypothesis hidden', () => {
    expect(PRICING_PUBLISHED).toBe(false)
  })

  it('formats prices', () => {
    expect(formatPrice(890, 'EUR', 'en')).toBe('€8.90')
    expect(formatPrice(890, 'EUR', 'es')).toMatch(/8,90\s?€/)
    expect(() => formatPrice(8.9, 'EUR')).toThrow()
    expect(() => formatPrice(-1, 'EUR')).toThrow()
  })
})

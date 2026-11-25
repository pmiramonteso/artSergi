import { describe, expect, it } from 'vitest'
import { canSetManually, manualTargets } from '../../shared/domain/order-status'

describe('manual order transitions', () => {
  it('follows the fulfilment path', () => {
    expect(manualTargets('paid')).toEqual(['fulfilled'])
    expect(manualTargets('fulfilled')).toEqual(['shipped'])
    expect(manualTargets('shipped')).toEqual(['delivered'])
  })
  it('never lets staff set payment states', () => {
    for (const from of ['pending', 'awaiting_payment', 'fulfilled'] as const) {
      expect(canSetManually(from, 'paid')).toBe(false)
      expect(canSetManually(from, 'refunded')).toBe(false)
    }
  })
})

describe('admin artwork update schema', async () => {
  const { artworkUpdateSchema } = await import('../../shared/schemas/admin')
  it('accepts a partial set of locales', () => {
    expect(
      artworkUpdateSchema.safeParse({ year: 2025, translations: { en: { title: 'T' } } }).success,
    ).toBe(true)
  })
  it('rejects unknown fields and locales, and bad types', () => {
    expect(artworkUpdateSchema.safeParse({ isAdmin: true }).success).toBe(false)
    expect(artworkUpdateSchema.safeParse({ translations: { fr: { title: 'x' } } }).success).toBe(
      false,
    )
    expect(artworkUpdateSchema.safeParse({ year: 'x' }).success).toBe(false)
  })
})

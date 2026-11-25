import { describe, expect, it } from 'vitest'
import {
  applyStatus,
  canTransition,
  isEntitled,
  isTerminal,
  SUBSCRIPTION_STATUSES,
} from '../../shared/domain/subscription'
import { computeOrderTotals, generateOrderNumber, lineTotal } from '../../shared/domain/order'

describe('subscription lifecycle', () => {
  it('allows the normal Stripe lifecycle', () => {
    expect(canTransition('incomplete', 'active')).toBe(true)
    expect(canTransition('active', 'past_due')).toBe(true)
    expect(canTransition('past_due', 'active')).toBe(true)
    expect(canTransition('active', 'canceled')).toBe(true)
  })

  it('terminal statuses never change', () => {
    expect(isTerminal('canceled')).toBe(true)
    expect(isTerminal('incomplete_expired')).toBe(true)
    for (const s of SUBSCRIPTION_STATUSES) {
      if (s !== 'canceled') expect(canTransition('canceled', s)).toBe(false)
    }
  })

  it('ignores out-of-order webhook statuses', () => {
    expect(applyStatus('canceled', 'active')).toBe('canceled')
    expect(applyStatus('active', 'incomplete')).toBe('active')
    expect(applyStatus('active', 'past_due')).toBe('past_due')
  })

  it('entitlement', () => {
    expect(isEntitled('active')).toBe(true)
    expect(isEntitled('past_due')).toBe(true)
    expect(isEntitled('incomplete')).toBe(false)
    expect(isEntitled('canceled')).toBe(false)
  })
})

describe('order arithmetic', () => {
  it('computes totals in integer cents', () => {
    expect(
      computeOrderTotals(
        [
          { unitAmount: 990, quantity: 2 },
          { unitAmount: 890, quantity: 1 },
        ],
        {
          shippingAmount: 350,
        },
      ),
    ).toEqual({ subtotalAmount: 2870, shippingAmount: 350, taxAmount: 0, totalAmount: 3220 })
  })

  it('rejects fractional, negative or empty input', () => {
    expect(() => lineTotal({ unitAmount: 9.9, quantity: 1 })).toThrow()
    expect(() => lineTotal({ unitAmount: 990, quantity: 0 })).toThrow()
    expect(() => computeOrderTotals([])).toThrow()
    expect(() =>
      computeOrderTotals([{ unitAmount: 1, quantity: 1 }], { shippingAmount: -1 }),
    ).toThrow()
  })

  it('generates readable order numbers without ambiguous characters', () => {
    const n = generateOrderNumber(new Date('2026-11-25T12:00:00Z'))
    expect(n).toMatch(/^ST-20261125-[2-9A-HJ-NP-Z]{6}$/)
  })
})

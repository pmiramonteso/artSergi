import { describe, expect, it } from 'vitest'
import { isSellable, resolveCommerce, stripeLocale } from '../../shared/domain/commerce'
import { checkoutRequestSchema } from '../../shared/schemas/checkout'

const base = { secretKey: 'sk_test_abc', webhookSecret: 'whsec_abc', pricingPublished: false }

describe('resolveCommerce (safety switch)', () => {
  it('is off by default and for unknown modes', () => {
    expect(resolveCommerce({ ...base, mode: undefined }).enabled).toBe(false)
    expect(resolveCommerce({ ...base, mode: 'yes' }).enabled).toBe(false)
  })
  it('test mode works only with test keys and a webhook secret', () => {
    expect(resolveCommerce({ ...base, mode: 'test' })).toEqual({ enabled: true, mode: 'test' })
    expect(resolveCommerce({ ...base, mode: 'test', secretKey: 'sk_live_x' }).enabled).toBe(false)
    expect(resolveCommerce({ ...base, mode: 'test', webhookSecret: '' }).enabled).toBe(false)
  })
  it('live mode needs live keys AND published pricing', () => {
    expect(resolveCommerce({ ...base, mode: 'live' }).enabled).toBe(false)
    expect(resolveCommerce({ ...base, mode: 'live', secretKey: 'sk_live_x' }).enabled).toBe(false)
    expect(
      resolveCommerce({ ...base, mode: 'live', secretKey: 'sk_live_x', pricingPublished: true }),
    ).toEqual({ enabled: true, mode: 'live' })
  })
})

describe('isSellable', () => {
  it('test mode allows the pilot catalogue; live requires approval', () => {
    expect(isSellable('test', { productActive: false, variantActive: false })).toBe(true)
    expect(isSellable('live', { productActive: true, variantActive: false })).toBe(false)
    expect(isSellable('live', { productActive: true, variantActive: true })).toBe(true)
  })
})

describe('checkout request', () => {
  it('rejects any price/total sent by the client', () => {
    expect(checkoutRequestSchema.safeParse({ sku: 'ART-MAIL-SINGLE', amount: 1 }).success).toBe(
      false,
    )
    expect(checkoutRequestSchema.safeParse({ sku: 'ART-MAIL-SINGLE', price: 1 }).success).toBe(
      false,
    )
  })
  it('bounds quantity and validates sku', () => {
    expect(checkoutRequestSchema.safeParse({ sku: 'ART-MAIL-SINGLE', quantity: 6 }).success).toBe(
      false,
    )
    expect(checkoutRequestSchema.safeParse({ sku: 'art mail' }).success).toBe(false)
    expect(checkoutRequestSchema.parse({ sku: 'ART-MAIL-SINGLE' })).toMatchObject({
      quantity: 1,
      locale: 'en',
    })
  })
  it('maps locales for Stripe Checkout', () => {
    expect(stripeLocale('es')).toBe('es')
    expect(stripeLocale('ca')).toBe('auto')
  })
})

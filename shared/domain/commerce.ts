/**
 * Commerce safety switch. Pure, so it is unit-tested exhaustively.
 *
 * - 'off'  (default): no checkout at all.
 * - 'test': Stripe TEST keys only (sk_test_/rk_test_). No real money moves.
 *            The pilot catalogue can be bought with test cards even though
 *            products are not yet approved for sale (active = false).
 * - 'live': real payments. Requires LIVE keys AND published, validated
 *            pricing; only products/variants with active = true are sellable.
 *
 * Any mismatch (e.g. a live key in test mode) disables commerce rather than
 * guessing, so a misconfiguration can never charge real cards by accident.
 */
export type CommerceMode = 'off' | 'test' | 'live'

export interface CommerceConfigInput {
  mode: unknown
  secretKey: unknown
  webhookSecret: unknown
  pricingPublished: boolean
}

export type CommerceState =
  { enabled: true; mode: 'test' | 'live' } | { enabled: false; mode: CommerceMode; reason: string }

export function resolveCommerce(input: CommerceConfigInput): CommerceState {
  const mode = input.mode === 'test' || input.mode === 'live' ? input.mode : 'off'
  if (mode === 'off') return { enabled: false, mode, reason: 'Commerce is off' }

  const key = typeof input.secretKey === 'string' ? input.secretKey : ''
  const whsec = typeof input.webhookSecret === 'string' ? input.webhookSecret : ''
  const isTestKey = /^(sk|rk)_test_/.test(key)
  const isLiveKey = /^(sk|rk)_live_/.test(key)

  if (!key) return { enabled: false, mode, reason: 'Missing Stripe secret key' }
  if (!whsec.startsWith('whsec_')) {
    return { enabled: false, mode, reason: 'Missing Stripe webhook secret' }
  }
  if (mode === 'test' && !isTestKey) {
    return { enabled: false, mode, reason: 'Test mode requires a Stripe TEST key' }
  }
  if (mode === 'live') {
    if (!isLiveKey) return { enabled: false, mode, reason: 'Live mode requires a Stripe LIVE key' }
    if (!input.pricingPublished) {
      return { enabled: false, mode, reason: 'Live mode requires validated, published pricing' }
    }
  }
  return { enabled: true, mode }
}

/** Whether a catalogue item may be sold in the given mode. */
export function isSellable(
  mode: 'test' | 'live',
  item: { productActive: boolean; variantActive: boolean },
): boolean {
  return mode === 'test' || (item.productActive && item.variantActive)
}

/** Stripe Checkout has no Catalan UI; fall back to the browser language. */
export function stripeLocale(locale: string): 'en' | 'es' | 'auto' {
  return locale === 'en' || locale === 'es' ? locale : 'auto'
}

import Stripe from 'stripe'
import type { H3Event } from 'h3'
import { PRICING_PUBLISHED } from '#shared/constants/products'
import { resolveCommerce, type CommerceState } from '#shared/domain/commerce'

let client: { key: string; stripe: Stripe } | undefined

export function commerceState(event?: H3Event): CommerceState {
  const c = useRuntimeConfig(event)
  return resolveCommerce({
    mode: c.commerceMode,
    secretKey: c.stripeSecretKey,
    webhookSecret: c.stripeWebhookSecret,
    pricingPublished: PRICING_PUBLISHED,
  })
}

/**
 * Stripe client + DB, or a 503 when commerce is not (correctly) configured.
 * The reason is logged server-side only, never sent to the browser.
 */
export function requireCommerce(event: H3Event) {
  const state = commerceState(event)
  const db = useDatabase()
  if (!state.enabled || !db) {
    if (import.meta.dev) {
      console.warn('[commerce] disabled:', state.enabled ? 'no database' : state.reason)
    }
    throw createError({
      statusCode: 503,
      statusMessage: 'Checkout is not available',
      data: { code: 'COMMERCE_DISABLED' },
    })
  }
  const key = String(useRuntimeConfig(event).stripeSecretKey)
  if (!client || client.key !== key) {
    client = { key, stripe: new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000 }) }
  }
  return { stripe: client.stripe, db, mode: state.mode }
}

export function shippingCountries(event: H3Event): string[] {
  return String(useRuntimeConfig(event).shippingCountries)
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c))
}

import { z } from 'zod'
import { DEFAULT_LOCALE, LOCALE_CODES } from '../constants/i18n'

/**
 * What the browser may send to start a checkout: WHAT to buy and HOW MANY.
 * Never a price, total or currency: those are looked up on the server.
 */
export const checkoutRequestSchema = z.strictObject({
  sku: z
    .string()
    .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/)
    .max(40),
  quantity: z.number().int().min(1).max(5).default(1),
  locale: z.enum(LOCALE_CODES as [string, ...string[]]).default(DEFAULT_LOCALE),
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>

/** Client-generated per attempt; makes retries/double-clicks safe. */
export const idempotencyKeySchema = z.uuid()

export const checkoutStatusQuerySchema = z.object({
  session_id: z
    .string()
    .regex(/^cs_(test|live)_[A-Za-z0-9]+$/)
    .max(200),
})

/** Public checkout status: no personal data, no amounts. */
export type CheckoutStatus = {
  status: 'paid' | 'pending' | 'cancelled' | 'unknown'
  orderNumber: string | null
}

export interface PublicOffer {
  sku: string
  title: string
  amount: number
  currency: string
  interval: 'month' | 'year' | null
  /** Remaining units for limited stock, null when not stock-tracked. */
  available: number | null
}

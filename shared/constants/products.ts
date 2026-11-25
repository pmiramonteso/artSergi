/**
 * Art Mail Club offers — the single place where prices live until they move
 * to the database (Phase 7) and Stripe Price IDs (Phase 8).
 *
 * These are the INITIAL PRICING HYPOTHESIS from the business brief. They are
 * not validated, so `PRICING_PUBLISHED` is false and the site shows
 * "Price announced at launch" instead. Never trust a price from the browser:
 * checkout will look prices up server-side by `id`.
 */
import type { LocalizedText } from './i18n'

export const PRICING_PUBLISHED = false

export interface Offer {
  id: 'art-mail-monthly' | 'art-mail-single' | 'art-mail-gift-3' | 'art-mail-annual'
  label: LocalizedText
  /** Integer minor units (cents). */
  amount: number
  currency: 'EUR'
  interval: 'month' | 'year' | null
  /** Shipping is charged separately (rates not defined yet). */
  plusShipping: boolean
  /** Extra note shown with the price, e.g. still under validation. */
  note?: string
}

export const artMailOffers: Offer[] = [
  {
    id: 'art-mail-monthly',
    label: { en: 'Monthly subscription', es: 'Suscripción mensual', ca: 'Subscripció mensual' },
    amount: 890,
    currency: 'EUR',
    interval: 'month',
    plusShipping: true,
  },
  {
    id: 'art-mail-single',
    label: {
      en: 'Places We Keep Nº 001 (single envelope)',
      es: 'Places We Keep Nº 001 (sobre suelto)',
      ca: 'Places We Keep Nº 001 (sobre solt)',
    },
    amount: 990,
    currency: 'EUR',
    interval: null,
    plusShipping: true,
  },
  {
    id: 'art-mail-gift-3',
    label: { en: 'Three-month gift', es: 'Regalo de tres meses', ca: 'Regal de tres mesos' },
    amount: 2670,
    currency: 'EUR',
    interval: null,
    plusShipping: true,
  },
  {
    id: 'art-mail-annual',
    label: { en: 'Annual collector', es: 'Coleccionista anual', ca: 'Col·leccionista anual' },
    amount: 9900,
    currency: 'EUR',
    interval: 'year',
    plusShipping: true,
    note: 'Subject to validation',
  },
]

export function formatPrice(amount: number, currency: Offer['currency'], locale = 'en'): string {
  if (!Number.isInteger(amount) || amount < 0) throw new Error(`Invalid amount: ${amount}`)
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / 100)
}

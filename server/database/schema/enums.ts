/** Enum value lists (MySQL enums are declared per column with mysqlEnum). */
export const LOCALES = ['en', 'es', 'ca'] as const
export const ARTWORK_STATUSES = ['available', 'sold', 'archived'] as const
export const PRODUCT_TYPES = [
  'original',
  'print',
  'art_mail_single',
  'art_mail_subscription',
  'art_mail_gift',
  'limited_edition',
] as const
export const BILLING_INTERVALS = ['month', 'year'] as const
export const RESERVATION_STATUSES = ['active', 'committed', 'released', 'expired'] as const
export const ORDER_STATUSES = [
  'pending',
  'awaiting_payment',
  'paid',
  'fulfilled',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded',
] as const
export const PAYMENT_STATUSES = [
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
] as const
/** Mirrors Stripe subscription statuses. */
export const SUBSCRIPTION_STATUSES = [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
] as const
export const SHIPMENT_STATUSES = [
  'pending',
  'label_created',
  'shipped',
  'in_transit',
  'delivered',
  'returned',
  'lost',
] as const
export const WEBHOOK_STATUSES = ['received', 'processed', 'failed'] as const
export const NEWSLETTER_STATUSES = ['pending', 'subscribed', 'unsubscribed'] as const

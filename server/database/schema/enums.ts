import { pgEnum } from 'drizzle-orm/pg-core'

export const localeEnum = pgEnum('locale', ['en', 'es', 'ca'])

export const artworkStatusEnum = pgEnum('artwork_status', ['available', 'sold', 'archived'])

export const productTypeEnum = pgEnum('product_type', [
  'original',
  'print',
  'art_mail_single',
  'art_mail_subscription',
  'art_mail_gift',
  'limited_edition',
])

export const billingIntervalEnum = pgEnum('billing_interval', ['month', 'year'])

export const reservationStatusEnum = pgEnum('reservation_status', [
  'active',
  'committed',
  'released',
  'expired',
])

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'awaiting_payment',
  'paid',
  'fulfilled',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
])

/** Mirrors Stripe subscription statuses. */
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
])

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'label_created',
  'shipped',
  'in_transit',
  'delivered',
  'returned',
  'lost',
])

export const webhookStatusEnum = pgEnum('webhook_status', ['received', 'processed', 'failed'])

export const newsletterStatusEnum = pgEnum('newsletter_status', [
  'pending',
  'subscribed',
  'unsubscribed',
])

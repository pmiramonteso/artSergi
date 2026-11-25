import { sql } from 'drizzle-orm'
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps, users } from './auth'
import { productVariants, shippingMethods } from './commerce'
import {
  localeEnum,
  orderStatusEnum,
  paymentStatusEnum,
  shipmentStatusEnum,
  subscriptionStatusEnum,
} from './enums'

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Optional link to an account; guest checkout leaves it null. */
    userId: uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    name: text('name'),
    stripeCustomerId: text('stripe_customer_id').unique(),
    locale: localeEnum('locale').notNull().default('en'),
    ...timestamps,
  },
  (t) => [index('customers_email_lower_idx').on(sql`lower(${t.email})`)],
)

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    line1: text('line1').notNull(),
    line2: text('line2'),
    city: text('city').notNull(),
    postalCode: text('postal_code').notNull(),
    region: text('region'),
    country: char('country', { length: 2 }).notNull(),
    phone: text('phone'),
    isDefault: boolean('is_default').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('addresses_customer_idx').on(t.customerId),
    check('addresses_country_iso', sql`${t.country} ~ '^[A-Z]{2}$'`),
  ],
)

export interface AddressSnapshot {
  name: string
  line1: string
  line2?: string | null
  city: string
  postalCode: string
  region?: string | null
  country: string
}

/**
 * Orders. Amounts are integer cents computed server-side. `idempotency_key`
 * makes order creation safe to retry; Stripe ids are unique so a webhook can
 * never attach one payment to two orders.
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    number: text('number').notNull().unique(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'restrict' }),
    email: text('email').notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
    locale: localeEnum('locale').notNull().default('en'),
    currency: char('currency', { length: 3 }).notNull().default('EUR'),
    subtotalAmount: integer('subtotal_amount').notNull(),
    shippingAmount: integer('shipping_amount').notNull().default(0),
    taxAmount: integer('tax_amount').notNull().default(0),
    totalAmount: integer('total_amount').notNull(),
    shippingMethodId: uuid('shipping_method_id').references(() => shippingMethods.id, {
      onDelete: 'restrict',
    }),
    shippingAddress: jsonb('shipping_address').$type<AddressSnapshot>(),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
    ...timestamps,
  },
  (t) => [
    index('orders_customer_idx').on(t.customerId),
    index('orders_status_idx').on(t.status),
    check(
      'orders_amounts_non_negative',
      sql`${t.subtotalAmount} >= 0 AND ${t.shippingAmount} >= 0 AND ${t.taxAmount} >= 0`,
    ),
    check(
      'orders_total_consistent',
      sql`${t.totalAmount} = ${t.subtotalAmount} + ${t.shippingAmount} + ${t.taxAmount}`,
    ),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    /** Snapshot: the order keeps what was bought even if the product changes. */
    titleSnapshot: text('title_snapshot').notNull(),
    quantity: integer('quantity').notNull(),
    unitAmount: integer('unit_amount').notNull(),
    totalAmount: integer('total_amount').notNull(),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    check('order_items_quantity_positive', sql`${t.quantity} > 0`),
    check('order_items_unit_non_negative', sql`${t.unitAmount} >= 0`),
    check('order_items_total_consistent', sql`${t.totalAmount} = ${t.unitAmount} * ${t.quantity}`),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    provider: text('provider').notNull().default('stripe'),
    providerPaymentId: text('provider_payment_id').notNull().unique(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    amount: integer('amount').notNull(),
    refundedAmount: integer('refunded_amount').notNull().default(0),
    currency: char('currency', { length: 3 }).notNull().default('EUR'),
    ...timestamps,
  },
  (t) => [
    index('payments_order_idx').on(t.orderId),
    check(
      'payments_amounts_valid',
      sql`${t.amount} >= 0 AND ${t.refundedAmount} >= 0 AND ${t.refundedAmount} <= ${t.amount}`,
    ),
  ],
)

export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    shippingMethodId: uuid('shipping_method_id').references(() => shippingMethods.id, {
      onDelete: 'restrict',
    }),
    status: shipmentStatusEnum('status').notNull().default('pending'),
    carrier: text('carrier'),
    trackingReference: text('tracking_reference'),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('shipments_order_idx').on(t.orderId)],
)

/**
 * Subscriptions are activated only from verified Stripe webhooks (Phase 8),
 * never from a browser redirect.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
    status: subscriptionStatusEnum('status').notNull(),
    priceId: text('price_id').notNull(),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'restrict' }),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    isGift: boolean('is_gift').notNull().default(false),
    giftRecipientEmail: text('gift_recipient_email'),
    ...timestamps,
  },
  (t) => [
    index('subscriptions_customer_idx').on(t.customerId),
    index('subscriptions_status_idx').on(t.status),
    check(
      'subscriptions_gift_recipient',
      sql`NOT ${t.isGift} OR ${t.giftRecipientEmail} IS NOT NULL`,
    ),
    check(
      'subscriptions_period_order',
      sql`${t.currentPeriodStart} IS NULL OR ${t.currentPeriodEnd} IS NULL OR ${t.currentPeriodEnd} > ${t.currentPeriodStart}`,
    ),
  ],
)

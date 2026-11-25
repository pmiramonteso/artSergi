import { sql } from 'drizzle-orm'
import {
  boolean,
  char,
  check,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core'
import { users } from './auth'
import { dateTime, exactVarchar, timestamps, uuidPk, uuidRef } from './columns'
import { isoUpper, productVariants, shippingMethods } from './commerce'
import {
  LOCALES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
} from './enums'

export const customers = mysqlTable(
  'customers',
  {
    id: uuidPk(),
    /** Optional link to an account; guest checkout leaves it null. */
    userId: uuidRef('user_id')
      .unique('customers_user_unique')
      .references(() => users.id, { onDelete: 'set null' }),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    stripeCustomerId: exactVarchar('stripe_customer_id', { length: 255 }).unique(
      'customers_stripe_unique',
    ),
    locale: mysqlEnum('locale', LOCALES).notNull().default('en'),
    ...timestamps,
  },
  (t) => [index('customers_email_idx').on(t.email)],
)

export const addresses = mysqlTable(
  'addresses',
  {
    id: uuidPk(),
    customerId: uuidRef('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 120 }).notNull(),
    postalCode: varchar('postal_code', { length: 32 }).notNull(),
    region: varchar('region', { length: 120 }),
    country: char('country', { length: 2 }).notNull(),
    phone: varchar('phone', { length: 40 }),
    isDefault: boolean('is_default').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('addresses_customer_idx').on(t.customerId),
    check('addresses_country_iso', isoUpper(t.country, 2)),
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
export const orders = mysqlTable(
  'orders',
  {
    id: uuidPk(),
    number: varchar('number', { length: 32 }).notNull().unique('orders_number_unique'),
    customerId: uuidRef('customer_id').references(() => customers.id, { onDelete: 'restrict' }),
    email: varchar('email', { length: 255 }).notNull(),
    status: mysqlEnum('status', ORDER_STATUSES).notNull().default('pending'),
    locale: mysqlEnum('locale', LOCALES).notNull().default('en'),
    currency: char('currency', { length: 3 }).notNull().default('EUR'),
    subtotalAmount: int('subtotal_amount').notNull(),
    shippingAmount: int('shipping_amount').notNull().default(0),
    taxAmount: int('tax_amount').notNull().default(0),
    totalAmount: int('total_amount').notNull(),
    shippingMethodId: uuidRef('shipping_method_id').references(() => shippingMethods.id, {
      onDelete: 'restrict',
    }),
    shippingAddress: json('shipping_address').$type<AddressSnapshot | null>(),
    idempotencyKey: exactVarchar('idempotency_key', { length: 64 })
      .notNull()
      .unique('orders_idempotency_unique'),
    stripeCheckoutSessionId: exactVarchar('stripe_checkout_session_id', { length: 255 }).unique(
      'orders_stripe_session_unique',
    ),
    stripePaymentIntentId: exactVarchar('stripe_payment_intent_id', { length: 255 }).unique(
      'orders_stripe_pi_unique',
    ),
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

export const orderItems = mysqlTable(
  'order_items',
  {
    id: uuidPk(),
    orderId: uuidRef('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuidRef('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    /** Snapshot: the order keeps what was bought even if the product changes. */
    titleSnapshot: varchar('title_snapshot', { length: 255 }).notNull(),
    quantity: int('quantity').notNull(),
    unitAmount: int('unit_amount').notNull(),
    totalAmount: int('total_amount').notNull(),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    check('order_items_quantity_positive', sql`${t.quantity} > 0`),
    check('order_items_unit_non_negative', sql`${t.unitAmount} >= 0`),
    check('order_items_total_consistent', sql`${t.totalAmount} = ${t.unitAmount} * ${t.quantity}`),
  ],
)

export const payments = mysqlTable(
  'payments',
  {
    id: uuidPk(),
    orderId: uuidRef('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    provider: varchar('provider', { length: 32 }).notNull().default('stripe'),
    providerPaymentId: exactVarchar('provider_payment_id', { length: 255 })
      .notNull()
      .unique('payments_provider_id_unique'),
    status: mysqlEnum('status', PAYMENT_STATUSES).notNull().default('pending'),
    amount: int('amount').notNull(),
    refundedAmount: int('refunded_amount').notNull().default(0),
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

export const shipments = mysqlTable(
  'shipments',
  {
    id: uuidPk(),
    orderId: uuidRef('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    shippingMethodId: uuidRef('shipping_method_id').references(() => shippingMethods.id, {
      onDelete: 'restrict',
    }),
    status: mysqlEnum('status', SHIPMENT_STATUSES).notNull().default('pending'),
    carrier: varchar('carrier', { length: 120 }),
    trackingReference: varchar('tracking_reference', { length: 120 }),
    shippedAt: dateTime('shipped_at'),
    deliveredAt: dateTime('delivered_at'),
    ...timestamps,
  },
  (t) => [index('shipments_order_idx').on(t.orderId)],
)

/**
 * Subscriptions are activated only from verified Stripe webhooks, never
 * from a browser redirect.
 */
export const subscriptions = mysqlTable(
  'subscriptions',
  {
    id: uuidPk(),
    customerId: uuidRef('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    stripeCustomerId: exactVarchar('stripe_customer_id', { length: 255 }).notNull(),
    stripeSubscriptionId: exactVarchar('stripe_subscription_id', { length: 255 })
      .notNull()
      .unique('subscriptions_stripe_unique'),
    status: mysqlEnum('status', SUBSCRIPTION_STATUSES).notNull(),
    priceId: exactVarchar('price_id', { length: 255 }).notNull(),
    variantId: uuidRef('variant_id').references(() => productVariants.id, { onDelete: 'restrict' }),
    currentPeriodStart: dateTime('current_period_start'),
    currentPeriodEnd: dateTime('current_period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    isGift: boolean('is_gift').notNull().default(false),
    giftRecipientEmail: varchar('gift_recipient_email', { length: 255 }),
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

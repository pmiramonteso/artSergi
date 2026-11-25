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
  primaryKey,
  text,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core'
import { dateTime, exactVarchar, timestamps, uuidPk, uuidRef } from './columns'
import { artworks, collections } from './content'
import { BILLING_INTERVALS, LOCALES, PRODUCT_TYPES, RESERVATION_STATUSES } from './enums'

/**
 * Upper-case ISO code check (case-sensitive regex, MySQL 8 ICU). The pattern
 * is a code constant inlined as a literal: DDL cannot take bound parameters.
 */
export const isoUpper = (col: unknown, n: 2 | 3) =>
  sql`REGEXP_LIKE(${col}, ${sql.raw(`'^[A-Z]{${n}}$'`)}, 'c')`

/**
 * Catalogue. Prices are integer minor units (cents) and are ONLY trusted
 * from here (or Stripe), never from the browser. Products are inactive by
 * default: nothing is sellable until explicitly activated.
 */
export const products = mysqlTable(
  'products',
  {
    id: uuidPk(),
    slug: varchar('slug', { length: 80 }).notNull().unique('products_slug_unique'),
    type: mysqlEnum('type', PRODUCT_TYPES).notNull(),
    collectionId: uuidRef('collection_id').references(() => collections.id, {
      onDelete: 'restrict',
    }),
    artworkId: uuidRef('artwork_id').references(() => artworks.id, { onDelete: 'restrict' }),
    active: boolean('active').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('products_collection_idx').on(t.collectionId),
    check(
      'products_original_has_artwork',
      sql`${t.type} <> 'original' OR ${t.artworkId} IS NOT NULL`,
    ),
  ],
)

export const productTranslations = mysqlTable(
  'product_translations',
  {
    productId: uuidRef('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    locale: mysqlEnum('locale', LOCALES).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
  },
  (t) => [primaryKey({ columns: [t.productId, t.locale] })],
)

export const productVariants = mysqlTable(
  'product_variants',
  {
    id: uuidPk(),
    productId: uuidRef('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 40 }).notNull().unique('product_variants_sku_unique'),
    name: varchar('name', { length: 255 }).notNull(),
    priceAmount: int('price_amount').notNull(),
    currency: char('currency', { length: 3 }).notNull().default('EUR'),
    /** Unique so one Stripe price maps to one variant. */
    stripePriceId: exactVarchar('stripe_price_id', { length: 255 }).unique(
      'product_variants_stripe_price_unique',
    ),
    billingInterval: mysqlEnum('billing_interval', BILLING_INTERVALS),
    intervalCount: int('interval_count'),
    active: boolean('active').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('product_variants_product_idx').on(t.productId),
    check('product_variants_price_non_negative', sql`${t.priceAmount} >= 0`),
    check('product_variants_currency_upper', isoUpper(t.currency, 3)),
    check(
      'product_variants_interval_pair',
      sql`(${t.billingInterval} IS NULL) = (${t.intervalCount} IS NULL) AND (${t.intervalCount} IS NULL OR ${t.intervalCount} > 0)`,
    ),
  ],
)

/**
 * Stock per variant. The CHECK constraints make overselling impossible at
 * the database level: reserved + sold can never exceed total.
 */
export const inventory = mysqlTable(
  'inventory',
  {
    variantId: uuidRef('variant_id')
      .primaryKey()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantityTotal: int('quantity_total').notNull(),
    quantityReserved: int('quantity_reserved').notNull().default(0),
    quantitySold: int('quantity_sold').notNull().default(0),
    updatedAt: dateTime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    check(
      'inventory_non_negative',
      sql`${t.quantityTotal} >= 0 AND ${t.quantityReserved} >= 0 AND ${t.quantitySold} >= 0`,
    ),
    check(
      'inventory_no_oversell',
      sql`${t.quantityReserved} + ${t.quantitySold} <= ${t.quantityTotal}`,
    ),
  ],
)

/** Temporary holds during checkout; expire automatically if not committed. */
export const inventoryReservations = mysqlTable(
  'inventory_reservations',
  {
    id: uuidPk(),
    variantId: uuidRef('variant_id')
      .notNull()
      .references(() => inventory.variantId, { onDelete: 'cascade' }),
    quantity: int('quantity').notNull(),
    status: mysqlEnum('status', RESERVATION_STATUSES).notNull().default('active'),
    /** Checkout session / order reference: makes reserve() idempotent. */
    reference: exactVarchar('reference', { length: 255 }).notNull(),
    expiresAt: dateTime('expires_at').notNull(),
    createdAt: dateTime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    unique('inventory_reservations_reference_variant').on(t.reference, t.variantId),
    index('inventory_reservations_active_expiry_idx').on(t.status, t.expiresAt),
    check('inventory_reservations_quantity_positive', sql`${t.quantity} > 0`),
  ],
)

/** Shipping options. Rates are configured by the business (none invented). */
export const shippingMethods = mysqlTable(
  'shipping_methods',
  {
    id: uuidPk(),
    code: varchar('code', { length: 64 }).notNull().unique('shipping_methods_code_unique'),
    name: varchar('name', { length: 255 }).notNull(),
    carrier: varchar('carrier', { length: 120 }),
    priceAmount: int('price_amount').notNull(),
    currency: char('currency', { length: 3 }).notNull().default('EUR'),
    /** ISO 3166-1 alpha-2 destination codes. */
    countries: json('countries')
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    active: boolean('active').notNull().default(false),
    sortOrder: int('sort_order').notNull().default(0),
    ...timestamps,
  },
  (t) => [check('shipping_methods_price_non_negative', sql`${t.priceAmount} >= 0`)],
)

import { sql } from 'drizzle-orm'
import {
  boolean,
  char,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from './auth'
import { artworks, collections } from './content'
import { billingIntervalEnum, localeEnum, productTypeEnum, reservationStatusEnum } from './enums'

/**
 * Catalogue. Prices are integer minor units (cents) and are ONLY trusted
 * from here (or Stripe), never from the browser. Products are inactive by
 * default: nothing is sellable until explicitly activated.
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    type: productTypeEnum('type').notNull(),
    collectionId: uuid('collection_id').references(() => collections.id, {
      onDelete: 'restrict',
    }),
    artworkId: uuid('artwork_id').references(() => artworks.id, { onDelete: 'restrict' }),
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

export const productTranslations = pgTable(
  'product_translations',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    title: text('title').notNull(),
    description: text('description'),
  },
  (t) => [primaryKey({ columns: [t.productId, t.locale] })],
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull().unique(),
    name: text('name').notNull(),
    priceAmount: integer('price_amount').notNull(),
    currency: char('currency', { length: 3 }).notNull().default('EUR'),
    /** Set in Phase 8. Unique so one Stripe price maps to one variant. */
    stripePriceId: text('stripe_price_id').unique(),
    billingInterval: billingIntervalEnum('billing_interval'),
    intervalCount: integer('interval_count'),
    active: boolean('active').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('product_variants_product_idx').on(t.productId),
    check('product_variants_price_non_negative', sql`${t.priceAmount} >= 0`),
    check('product_variants_currency_upper', sql`${t.currency} ~ '^[A-Z]{3}$'`),
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
export const inventory = pgTable(
  'inventory',
  {
    variantId: uuid('variant_id')
      .primaryKey()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantityTotal: integer('quantity_total').notNull(),
    quantityReserved: integer('quantity_reserved').notNull().default(0),
    quantitySold: integer('quantity_sold').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
export const inventoryReservations = pgTable(
  'inventory_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => inventory.variantId, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    status: reservationStatusEnum('status').notNull().default('active'),
    /** Checkout session / order reference: makes reserve() idempotent. */
    reference: text('reference').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('inventory_reservations_reference_variant').on(t.reference, t.variantId),
    index('inventory_reservations_active_expiry_idx').on(t.status, t.expiresAt),
    check('inventory_reservations_quantity_positive', sql`${t.quantity} > 0`),
  ],
)

/** Shipping options. Rates are configured by the business (none invented). */
export const shippingMethods = pgTable(
  'shipping_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    carrier: text('carrier'),
    priceAmount: integer('price_amount').notNull(),
    currency: char('currency', { length: 3 }).notNull().default('EUR'),
    /** ISO 3166-1 alpha-2 destination codes. */
    countries: text('countries')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    active: boolean('active').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (t) => [check('shipping_methods_price_non_negative', sql`${t.priceAmount} >= 0`)],
)

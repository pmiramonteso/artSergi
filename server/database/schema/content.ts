import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/mysql-core'
import type { ArtworkImage } from '../../../shared/types/artwork'
import { timestamps, uuidPk, uuidRef } from './columns'
import { ARTWORK_STATUSES, LOCALES } from './enums'

export const artists = mysqlTable('artists', {
  id: uuidPk(),
  slug: varchar('slug', { length: 80 }).notNull().unique('artists_slug_unique'),
  name: varchar('name', { length: 255 }).notNull(),
  ...timestamps,
})

/**
 * Artworks. Unknown facts stay NULL (never invented); localized title,
 * description and image alt text live in artwork_translations.
 */
export const artworks = mysqlTable(
  'artworks',
  {
    id: uuidPk(),
    artistId: uuidRef('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'restrict' }),
    slug: varchar('slug', { length: 80 }).notNull().unique('artworks_slug_unique'),
    status: mysqlEnum('status', ARTWORK_STATUSES).notNull(),
    featured: boolean('featured').notNull().default(false),
    sortOrder: int('sort_order').notNull().default(0),
    year: int('year'),
    medium: varchar('medium', { length: 200 }),
    widthCm: decimal('width_cm', { precision: 6, scale: 1, mode: 'number' }),
    heightCm: decimal('height_cm', { precision: 6, scale: 1, mode: 'number' }),
    depthCm: decimal('depth_cm', { precision: 6, scale: 1, mode: 'number' }),
    /** {src,width,height,srcset?} — alt text is per locale in translations. */
    image: json('image').$type<Omit<ArtworkImage, 'alt'> | null>(),
    gallery: json('gallery')
      .$type<Omit<ArtworkImage, 'alt'>[]>()
      .notNull()
      .$defaultFn(() => []),
    ...timestamps,
  },
  (t) => [
    index('artworks_status_idx').on(t.status),
    index('artworks_featured_idx').on(t.featured, t.sortOrder),
    check('artworks_year_range', sql`${t.year} IS NULL OR ${t.year} BETWEEN 1900 AND 2200`),
    check(
      'artworks_dimensions_positive',
      sql`(${t.widthCm} IS NULL OR ${t.widthCm} > 0) AND (${t.heightCm} IS NULL OR ${t.heightCm} > 0) AND (${t.depthCm} IS NULL OR ${t.depthCm} > 0)`,
    ),
    check('artworks_dimensions_pair', sql`(${t.widthCm} IS NULL) = (${t.heightCm} IS NULL)`),
  ],
)

export const artworkTranslations = mysqlTable(
  'artwork_translations',
  {
    artworkId: uuidRef('artwork_id')
      .notNull()
      .references(() => artworks.id, { onDelete: 'cascade' }),
    locale: mysqlEnum('locale', LOCALES).notNull(),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    imageAlt: text('image_alt'),
  },
  (t) => [primaryKey({ columns: [t.artworkId, t.locale] })],
)

export interface CollectionContentItem {
  name: string
  detail: Record<'en' | 'es' | 'ca', string>
}

export const collections = mysqlTable(
  'collections',
  {
    id: uuidPk(),
    slug: varchar('slug', { length: 80 }).notNull().unique('collections_slug_unique'),
    number: varchar('number', { length: 32 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    editionSize: int('edition_size').notNull(),
    accent: varchar('accent', { length: 32 }).notNull().default('tomato'),
    contents: json('contents')
      .$type<CollectionContentItem[]>()
      .notNull()
      .$defaultFn(() => []),
    active: boolean('active').notNull().default(false),
    ...timestamps,
  },
  (t) => [check('collections_edition_size_positive', sql`${t.editionSize} > 0`)],
)

export const collectionTranslations = mysqlTable(
  'collection_translations',
  {
    collectionId: uuidRef('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    locale: mysqlEnum('locale', LOCALES).notNull(),
    tagline: varchar('tagline', { length: 255 }).notNull(),
    description: text('description').notNull(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.locale] })],
)

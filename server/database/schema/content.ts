import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import type { ArtworkImage } from '../../../shared/types/artwork'
import { timestamps } from './auth'
import { artworkStatusEnum, localeEnum } from './enums'

export const artists = pgTable('artists', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  ...timestamps,
})

/**
 * Artworks. Unknown facts stay NULL (never invented); localized title,
 * description and image alt text live in artwork_translations.
 */
export const artworks = pgTable(
  'artworks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    artistId: uuid('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'restrict' }),
    slug: text('slug').notNull().unique(),
    status: artworkStatusEnum('status').notNull(),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    year: integer('year'),
    medium: text('medium'),
    widthCm: numeric('width_cm', { precision: 6, scale: 1, mode: 'number' }),
    heightCm: numeric('height_cm', { precision: 6, scale: 1, mode: 'number' }),
    depthCm: numeric('depth_cm', { precision: 6, scale: 1, mode: 'number' }),
    /** {src,width,height} — alt text is per locale in translations. */
    image: jsonb('image').$type<Omit<ArtworkImage, 'alt'>>(),
    gallery: jsonb('gallery').$type<Omit<ArtworkImage, 'alt'>[]>().notNull().default([]),
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

export const artworkTranslations = pgTable(
  'artwork_translations',
  {
    artworkId: uuid('artwork_id')
      .notNull()
      .references(() => artworks.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    title: text('title'),
    description: text('description'),
    imageAlt: text('image_alt'),
  },
  (t) => [primaryKey({ columns: [t.artworkId, t.locale] })],
)

export interface CollectionContentItem {
  name: string
  detail: Record<'en' | 'es' | 'ca', string>
}

export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    number: text('number').notNull(),
    title: text('title').notNull(),
    editionSize: integer('edition_size').notNull(),
    accent: text('accent').notNull().default('tomato'),
    contents: jsonb('contents').$type<CollectionContentItem[]>().notNull().default([]),
    active: boolean('active').notNull().default(false),
    ...timestamps,
  },
  (t) => [check('collections_edition_size_positive', sql`${t.editionSize} > 0`)],
)

export const collectionTranslations = pgTable(
  'collection_translations',
  {
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.locale] })],
)

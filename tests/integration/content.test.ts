import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { seedDatabase } from '../../server/database/seed'
import {
  artworks,
  artworkTranslations,
  productVariants,
  products,
} from '../../server/database/schema'
import { contentRepositories } from '../../server/services/content'
import { artworks as staticArtworks } from '../../app/data/artworks'
import { currentCollection } from '../../app/data/collections'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

let db: Database
let close: () => Promise<void>

beforeAll(async () => {
  ;({ db, close } = await createTestDatabase())
  await seedDatabase(db)
})
afterAll(() => close())

describe('seed', () => {
  it('is idempotent', async () => {
    await seedDatabase(db)
    await seedDatabase(db)
    expect(await db.select().from(artworks)).toHaveLength(staticArtworks.length)
  })

  it('creates every sellable variant INACTIVE (nothing for sale until validated)', async () => {
    const variants = await db.select().from(productVariants)
    expect(variants.length).toBeGreaterThan(0)
    expect(variants.every((v) => v.active === false)).toBe(true)
    const prods = await db.select().from(products)
    expect(prods.every((p) => p.active === false)).toBe(true)
  })
})

describe('database content matches the static fallback', () => {
  it('artworks list is identical in shape and values', async () => {
    const fromDb = await contentRepositories(db).artworks.list('en')
    const fromStatic = await contentRepositories(null).artworks.list('en')
    expect(fromDb).toEqual(fromStatic)
  })

  it('collection is identical', async () => {
    const c = await contentRepositories(db).collections.findBySlug('places-we-keep')
    expect(c).toEqual(currentCollection)
  })

  it('unknown slugs return null', async () => {
    expect(await contentRepositories(db).artworks.findBySlug('nope', 'en')).toBeNull()
    expect(await contentRepositories(db).collections.findBySlug('nope')).toBeNull()
  })
})

describe('artwork mapping', () => {
  it('falls back to the default locale and never publishes an image without alt text', async () => {
    const [row] = await db.select().from(artworks).where(eq(artworks.slug, 'painting-001'))
    await db
      .update(artworks)
      .set({ image: { src: '/images/x.webp', width: 800, height: 1000 } })
      .where(eq(artworks.id, row!.id))
    await db
      .update(artworkTranslations)
      .set({ title: 'English title', imageAlt: null })
      .where(eq(artworkTranslations.artworkId, row!.id))
    await db.delete(artworkTranslations).where(eq(artworkTranslations.locale, 'ca'))

    const ca = await contentRepositories(db).artworks.findBySlug('painting-001', 'ca')
    expect(ca?.title).toBe('English title') // fallback to EN
    expect(ca?.image).toBeNull() // no alt → not published

    await db
      .update(artworkTranslations)
      .set({ imageAlt: 'Visible description' })
      .where(eq(artworkTranslations.artworkId, row!.id))
    const en = await contentRepositories(db).artworks.findBySlug('painting-001', 'en')
    expect(en?.image).toEqual({
      src: '/images/x.webp',
      width: 800,
      height: 1000,
      alt: 'Visible description',
    })
    // Internal columns never leak.
    expect(en).not.toHaveProperty('artistId')
    expect(en).not.toHaveProperty('createdAt')
    expect(en).not.toHaveProperty('sortOrder')
  })
})

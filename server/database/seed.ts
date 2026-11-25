import { eq, sql } from 'drizzle-orm'
import { artworkSources as staticArtworks } from '../../app/data/artworks'
import { currentCollection } from '../../app/data/collections'
import { LOCALE_CODES } from '../../shared/constants/i18n'
import { artMailOffers } from '../../shared/constants/products'
import type { Database } from './client'
import {
  artists,
  artworks,
  artworkTranslations,
  collections,
  collectionTranslations,
  inventory,
  products,
  productTranslations,
  productVariants,
} from './schema'

/**
 * Idempotent seed from the approved static content. Safe to run repeatedly.
 *
 * - Content (artist, the 3 sold works, Places We Keep Nº 001) mirrors app/data.
 * - Art Mail offers are created INACTIVE with the brief's hypothesis prices:
 *   nothing is sellable until the business validates prices and activates
 *   them (OPEN_QUESTIONS B2). Only the single collection gets stock (pilot 50).
 * - No shipping methods are created: rates are not defined yet (B3).
 */
export async function seedDatabase(db: Database) {
  return db.transaction(async (tx) => {
    // MySQL has no RETURNING: upsert, then read the row back by its unique key.
    await tx
      .insert(artists)
      .values({ slug: 'sergi-tugas', name: 'Sergi Tugas' })
      .onDuplicateKeyUpdate({ set: { name: 'Sergi Tugas' } })
    const [artist] = await tx.select().from(artists).where(eq(artists.slug, 'sergi-tugas'))

    for (const [i, a] of staticArtworks.entries()) {
      const values = {
        artistId: artist!.id,
        slug: a.slug,
        status: a.status,
        featured: a.featured,
        sortOrder: i,
        year: a.year,
        medium: a.medium,
        widthCm: a.dimensions?.widthCm ?? null,
        heightCm: a.dimensions?.heightCm ?? null,
        depthCm: a.dimensions?.depthCm ?? null,
        image: a.image
          ? {
              src: a.image.src,
              width: a.image.width,
              height: a.image.height,
              ...(a.image.srcset ? { srcset: a.image.srcset } : {}),
            }
          : null,
        gallery: a.gallery.map(({ src, width, height }) => ({ src, width, height })),
      }
      await tx
        .insert(artworks)
        .values(values)
        .onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } })
      const [row] = await tx.select().from(artworks).where(eq(artworks.slug, a.slug))
      // Title/description are not localized yet (null until supplied); alt text is.
      for (const locale of LOCALE_CODES) {
        const tr = {
          title: a.title,
          description: a.description,
          imageAlt: a.image?.alt[locale] ?? null,
        }
        await tx
          .insert(artworkTranslations)
          .values({ artworkId: row!.id, locale, ...tr })
          .onDuplicateKeyUpdate({ set: tr })
      }
    }

    const c = currentCollection
    const collectionValues = {
      slug: c.slug,
      number: c.number,
      title: c.title,
      editionSize: c.editionSize,
      accent: c.accent,
      contents: c.contents,
      active: true,
    }
    await tx
      .insert(collections)
      .values(collectionValues)
      .onDuplicateKeyUpdate({ set: { ...collectionValues, updatedAt: new Date() } })
    const [collection] = await tx.select().from(collections).where(eq(collections.slug, c.slug))
    for (const locale of LOCALE_CODES) {
      const tr = { tagline: c.tagline[locale], description: c.description[locale] }
      await tx
        .insert(collectionTranslations)
        .values({ collectionId: collection!.id, locale, ...tr })
        .onDuplicateKeyUpdate({ set: tr })
    }

    const typeByOffer = {
      'art-mail-single': 'art_mail_single',
      'art-mail-monthly': 'art_mail_subscription',
      'art-mail-gift-3': 'art_mail_gift',
      'art-mail-annual': 'art_mail_subscription',
    } as const
    for (const offer of artMailOffers) {
      const slug = offer.id === 'art-mail-single' ? `${c.slug}-single` : offer.id
      await tx
        .insert(products)
        .values({
          slug,
          type: typeByOffer[offer.id],
          collectionId: offer.id === 'art-mail-single' ? collection!.id : null,
          active: false,
        })
        // Existing products are left untouched (the admin may have activated them).
        .onDuplicateKeyUpdate({ set: { id: sql`id` } })
      const productId = (await tx.select().from(products).where(eq(products.slug, slug)))[0]!.id
      for (const locale of LOCALE_CODES) {
        await tx
          .insert(productTranslations)
          .values({ productId, locale, title: offer.label[locale] })
          .onDuplicateKeyUpdate({ set: { title: offer.label[locale] } })
      }

      const sku = offer.id.toUpperCase()
      await tx
        .insert(productVariants)
        .values({
          productId,
          sku,
          name: offer.label.en,
          priceAmount: offer.amount,
          currency: offer.currency,
          billingInterval: offer.interval,
          intervalCount: offer.interval ? 1 : null,
          active: false,
        })
        // Existing variants keep their (possibly admin-edited) price and state.
        .onDuplicateKeyUpdate({ set: { id: sql`id` } })
      if (offer.id === 'art-mail-single') {
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.sku, sku))
        // Stock is only set the first time; later runs never reset it.
        await tx
          .insert(inventory)
          .values({ variantId: variant!.id, quantityTotal: c.editionSize })
          .onDuplicateKeyUpdate({ set: { variantId: sql`variant_id` } })
      }
    }

    return { artworks: staticArtworks.length, collections: 1, offers: artMailOffers.length }
  })
}

import { eq } from 'drizzle-orm'
import { artworks as staticArtworks } from '../../app/data/artworks'
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
  roles,
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
    for (const name of ['admin', 'editor', 'customer']) {
      await tx.insert(roles).values({ name }).onConflictDoNothing()
    }

    const [artist] = await tx
      .insert(artists)
      .values({ slug: 'sergi-tugas', name: 'Sergi Tugas' })
      .onConflictDoUpdate({ target: artists.slug, set: { name: 'Sergi Tugas' } })
      .returning()

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
        image: a.image ? { src: a.image.src, width: a.image.width, height: a.image.height } : null,
        gallery: a.gallery.map(({ src, width, height }) => ({ src, width, height })),
      }
      const [row] = await tx
        .insert(artworks)
        .values(values)
        .onConflictDoUpdate({ target: artworks.slug, set: { ...values, updatedAt: new Date() } })
        .returning()
      // Static content is not localized per field yet: same text for every locale.
      for (const locale of LOCALE_CODES) {
        const tr = { title: a.title, description: a.description, imageAlt: a.image?.alt ?? null }
        await tx
          .insert(artworkTranslations)
          .values({ artworkId: row!.id, locale, ...tr })
          .onConflictDoUpdate({
            target: [artworkTranslations.artworkId, artworkTranslations.locale],
            set: tr,
          })
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
    const [collection] = await tx
      .insert(collections)
      .values(collectionValues)
      .onConflictDoUpdate({
        target: collections.slug,
        set: { ...collectionValues, updatedAt: new Date() },
      })
      .returning()
    for (const locale of LOCALE_CODES) {
      const tr = { tagline: c.tagline[locale], description: c.description[locale] }
      await tx
        .insert(collectionTranslations)
        .values({ collectionId: collection!.id, locale, ...tr })
        .onConflictDoUpdate({
          target: [collectionTranslations.collectionId, collectionTranslations.locale],
          set: tr,
        })
    }

    const typeByOffer = {
      'art-mail-single': 'art_mail_single',
      'art-mail-monthly': 'art_mail_subscription',
      'art-mail-gift-3': 'art_mail_gift',
      'art-mail-annual': 'art_mail_subscription',
    } as const
    for (const offer of artMailOffers) {
      const slug = offer.id === 'art-mail-single' ? `${c.slug}-single` : offer.id
      const [product] = await tx
        .insert(products)
        .values({
          slug,
          type: typeByOffer[offer.id],
          collectionId: offer.id === 'art-mail-single' ? collection!.id : null,
          active: false,
        })
        .onConflictDoNothing({ target: products.slug })
        .returning()
      const productId =
        product?.id ??
        (await tx.select().from(products).where(eq(products.slug, slug)).limit(1))[0]!.id
      await tx
        .insert(productTranslations)
        .values({ productId, locale: 'en', title: offer.label })
        .onConflictDoNothing()

      const sku = offer.id.toUpperCase()
      const [variant] = await tx
        .insert(productVariants)
        .values({
          productId,
          sku,
          name: offer.label,
          priceAmount: offer.amount,
          currency: offer.currency,
          billingInterval: offer.interval,
          intervalCount: offer.interval ? 1 : null,
          active: false,
        })
        .onConflictDoNothing({ target: productVariants.sku })
        .returning()
      if (variant && offer.id === 'art-mail-single') {
        await tx
          .insert(inventory)
          .values({ variantId: variant.id, quantityTotal: c.editionSize })
          .onConflictDoNothing()
      }
    }

    return { artworks: staticArtworks.length, collections: 1, offers: artMailOffers.length }
  })
}

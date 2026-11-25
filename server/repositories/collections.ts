import { eq } from 'drizzle-orm'
import { LOCALE_CODES, type LocalizedText } from '../../shared/constants/i18n'
import type { Collection } from '../../shared/types/collection'
import type { Database } from '../database/client'
import { collections, collectionTranslations } from '../database/schema'

export interface CollectionRepository {
  findBySlug(slug: string): Promise<Collection | null>
}

const ACCENTS = ['tomato', 'electric-blue', 'butter'] as const

export function createDbCollectionRepository(db: Database): CollectionRepository {
  return {
    async findBySlug(slug) {
      const [row] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1)
      if (!row) return null
      const trs = await db
        .select()
        .from(collectionTranslations)
        .where(eq(collectionTranslations.collectionId, row.id))
      const pick = (field: 'tagline' | 'description') =>
        Object.fromEntries(
          LOCALE_CODES.map((l) => [
            l,
            trs.find((t) => t.locale === l)?.[field] ??
              trs.find((t) => t.locale === 'en')?.[field] ??
              '',
          ]),
        ) as LocalizedText
      return {
        slug: row.slug,
        number: row.number,
        title: row.title,
        tagline: pick('tagline'),
        description: pick('description'),
        contents: row.contents,
        editionSize: row.editionSize,
        accent: (ACCENTS as readonly string[]).includes(row.accent)
          ? (row.accent as Collection['accent'])
          : 'tomato',
      }
    },
  }
}

export function createStaticCollectionRepository(data: Collection[]): CollectionRepository {
  return { findBySlug: async (slug) => data.find((c) => c.slug === slug) ?? null }
}

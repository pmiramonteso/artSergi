import { and, asc, eq, inArray } from 'drizzle-orm'
import type { Artwork } from '../../shared/types/artwork'
import { DEFAULT_LOCALE, type LocaleCode } from '../../shared/constants/i18n'
import type { Database } from '../database/client'
import { localizeArtwork, type ArtworkSource } from '../../app/data/artworks'
import { artists, artworks, artworkTranslations } from '../database/schema'

export interface ArtworkRepository {
  list(locale: LocaleCode): Promise<Artwork[]>
  findBySlug(slug: string, locale: LocaleCode): Promise<Artwork | null>
}

type ArtworkRow = typeof artworks.$inferSelect
type TranslationRow = typeof artworkTranslations.$inferSelect

/**
 * Maps a DB row + translations to the public Artwork model. Missing
 * translations fall back to the default locale; missing facts stay null.
 * Internal columns (ids of other tables, timestamps, sort order) are never
 * exposed.
 */
export function toPublicArtwork(
  row: ArtworkRow,
  translations: TranslationRow[],
  locale: LocaleCode,
): Artwork {
  // Per-field fallback: a translation row may exist with only some fields.
  const own = translations.find((t) => t.locale === locale)
  const base = translations.find((t) => t.locale === DEFAULT_LOCALE)
  const tr = {
    title: own?.title ?? base?.title ?? null,
    description: own?.description ?? base?.description ?? null,
  }
  const alt = own?.imageAlt ?? base?.imageAlt ?? ''
  return {
    id: row.slug,
    slug: row.slug,
    title: tr.title,
    description: tr.description,
    year: row.year,
    medium: row.medium,
    dimensions:
      row.widthCm != null && row.heightCm != null
        ? {
            widthCm: row.widthCm,
            heightCm: row.heightCm,
            ...(row.depthCm != null ? { depthCm: row.depthCm } : {}),
          }
        : null,
    // An image without alt text is not published (accessibility rule).
    image: row.image && alt ? { ...row.image, alt } : null,
    gallery: alt ? row.gallery.map((g) => ({ ...g, alt })) : [],
    status: row.status,
    featured: row.featured,
  }
}

export function createDbArtworkRepository(
  db: Database,
  artistSlug = 'sergi-tugas',
): ArtworkRepository {
  async function load(where?: ReturnType<typeof eq>) {
    const rows = await db
      .select({ artwork: artworks })
      .from(artworks)
      .innerJoin(artists, eq(artists.id, artworks.artistId))
      .where(where ? and(eq(artists.slug, artistSlug), where) : eq(artists.slug, artistSlug))
      .orderBy(asc(artworks.sortOrder), asc(artworks.slug))
    const list = rows.map((r) => r.artwork)
    if (!list.length) return { list, translations: [] as TranslationRow[] }
    const translations = await db
      .select()
      .from(artworkTranslations)
      .where(
        inArray(
          artworkTranslations.artworkId,
          list.map((a) => a.id),
        ),
      )
    return { list, translations }
  }

  return {
    async list(locale) {
      const { list, translations } = await load()
      return list.map((a) =>
        toPublicArtwork(
          a,
          translations.filter((t) => t.artworkId === a.id),
          locale,
        ),
      )
    },
    async findBySlug(slug, locale) {
      const { list, translations } = await load(eq(artworks.slug, slug))
      const a = list[0]
      return a ? toPublicArtwork(a, translations, locale) : null
    },
  }
}

/** Fallback when no database is configured: serves app/data content. */
export function createStaticArtworkRepository(data: ArtworkSource[]): ArtworkRepository {
  return {
    list: async (locale) => data.map((a) => localizeArtwork(a, locale)),
    findBySlug: async (slug, locale) => {
      const a = data.find((x) => x.slug === slug)
      return a ? localizeArtwork(a, locale) : null
    },
  }
}

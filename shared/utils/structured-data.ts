import type { Artwork } from '../types/artwork'

/**
 * Schema.org JSON-LD builders. Rule: publish only facts that are verified
 * and visible on the page. Unknown values are omitted, never guessed. No
 * ratings, reviews, prices or stock are emitted here.
 */

type JsonLd = Record<string, unknown>

const ARTIST_NAME = 'Sergi Tugas'

export function websiteJsonLd(opts: { url: string; name: string; inLanguage: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: opts.name,
    url: opts.url,
    inLanguage: opts.inLanguage,
  }
}

/** Person: the artist. Name, url, a real photo and confirmed social profiles only. */
export function personJsonLd(opts: { url: string; sameAs?: string[]; image?: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: ARTIST_NAME,
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * VisualArtwork, or `null` when the artwork has no confirmed title: a
 * placeholder like "Untitled (title pending)" must not be published as data.
 */
export function visualArtworkJsonLd(
  artwork: Artwork,
  opts: { url: string; origin: string; inLanguage: string },
): JsonLd | null {
  if (!artwork.title) return null
  const d = artwork.dimensions
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    url: opts.url,
    inLanguage: opts.inLanguage,
    creator: { '@type': 'Person', name: ARTIST_NAME },
    ...(artwork.description ? { description: artwork.description } : {}),
    ...(artwork.image ? { image: new URL(artwork.image.src, opts.origin).toString() } : {}),
    ...(artwork.year ? { dateCreated: String(artwork.year) } : {}),
    ...(artwork.medium ? { artMedium: artwork.medium } : {}),
    ...(d
      ? {
          width: { '@type': 'Distance', name: `${d.widthCm} cm` },
          height: { '@type': 'Distance', name: `${d.heightCm} cm` },
          ...(d.depthCm ? { depth: { '@type': 'Distance', name: `${d.depthCm} cm` } } : {}),
        }
      : {}),
  }
}

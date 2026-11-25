import type { Artwork } from '#shared/types/artwork'

/**
 * Artworks shown on the site until the database exists (Phase 7).
 *
 * The three paintings below are the ones Sergi supplied as references. They
 * are SOLD. Titles, years, media, dimensions and descriptions are left `null`
 * on purpose: they must come from the artist, never be made up.
 * Photos go in /public/images/artworks/<slug>/ (see ASSET_GUIDELINES.md).
 */
export const artworks: Artwork[] = [
  {
    id: 'painting-001',
    slug: 'painting-001',
    title: null,
    description: null,
    year: null,
    medium: null,
    dimensions: null,
    image: null,
    gallery: [],
    status: 'sold',
    featured: true,
  },
  {
    id: 'painting-002',
    slug: 'painting-002',
    title: null,
    description: null,
    year: null,
    medium: null,
    dimensions: null,
    image: null,
    gallery: [],
    status: 'sold',
    featured: true,
  },
  {
    id: 'painting-003',
    slug: 'painting-003',
    title: null,
    description: null,
    year: null,
    medium: null,
    dimensions: null,
    image: null,
    gallery: [],
    status: 'sold',
    featured: true,
  },
]

export const featuredArtworks = artworks.filter((a) => a.featured)

export function findArtwork(slug: string): Artwork | undefined {
  return artworks.find((a) => a.slug === slug)
}

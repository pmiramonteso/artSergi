/**
 * Hero content. When Sergi supplies the assets, set `image` / `lettering`
 * and the placeholders are replaced automatically. Do not invent titles or
 * alt text: describe only what is visible, and review it with the artist.
 */

export interface HeroImage {
  src: string
  width: number
  height: number
  alt: string
}

export interface HeroArtworkSlot {
  id: 'artwork-1' | 'artwork-2' | 'artwork-3'
  /** Shown on the placeholder until the real photo exists. */
  placeholderLabel: string
  /** Width / height of the painting, used for the frame before the image loads. */
  ratio: string
  image: HeroImage | null
}

export const heroArtworks: HeroArtworkSlot[] = [
  {
    id: 'artwork-1',
    placeholderLabel: 'Painting 1: photo pending',
    ratio: '4 / 5',
    // e.g. { src: '/images/artworks/painting-001/artwork-<slug>-hero.webp', width: 1200, height: 1500, alt: '…' }
    image: null,
  },
  {
    id: 'artwork-2',
    placeholderLabel: 'Painting 2: photo pending',
    ratio: '4 / 5',
    image: null,
  },
  {
    id: 'artwork-3',
    placeholderLabel: 'Painting 3: photo pending',
    ratio: '4 / 5',
    image: null,
  },
]

/**
 * Sergi's handwritten lettering (SVG). `null` shows a clearly labeled
 * typeset placeholder. Expected file: /illustrations/lettering/hero-lettering.svg
 */
export const heroLettering: HeroImage | null = null

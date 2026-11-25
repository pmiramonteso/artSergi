import { featuredArtworks } from './artworks'
import type { ArtworkImage } from '#shared/types/artwork'

/**
 * Hero content. The floating artworks are the first three featured artworks
 * (app/data/artworks.ts), so adding a photo there updates the hero too.
 */
export type HeroImage = ArtworkImage

export interface HeroArtworkSlot {
  id: string
  /** 1-based position, used for the localized placeholder label. */
  position: number
  /** Width / height of the frame before the image loads. */
  ratio: string
  image: HeroImage | null
}

export const heroArtworks: HeroArtworkSlot[] = featuredArtworks.slice(0, 3).map((a, i) => ({
  id: a.id,
  position: i + 1,
  ratio: a.image ? `${a.image.width} / ${a.image.height}` : '4 / 5',
  image: a.image,
}))

/**
 * Sergi's handwritten lettering (SVG). `null` shows a clearly labeled
 * typeset placeholder. Expected file: /illustrations/lettering/hero-lettering.svg
 */
export const heroLettering: HeroImage | null = null

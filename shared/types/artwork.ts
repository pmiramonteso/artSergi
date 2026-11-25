export type ArtworkStatus = 'available' | 'sold' | 'archived'

export interface ArtworkImage {
  src: string
  width: number
  height: number
  /** Describe only what is visible. Reviewed with the artist. */
  alt: string
}

export interface ArtworkDimensions {
  widthCm: number
  heightCm: number
  depthCm?: number
}

/**
 * Public artwork model. `null` means "not supplied by the artist yet":
 * the UI shows it as pending and never makes a value up.
 */
export interface Artwork {
  id: string
  slug: string
  title: string | null
  description: string | null
  year: number | null
  medium: string | null
  dimensions: ArtworkDimensions | null
  image: ArtworkImage | null
  gallery: ArtworkImage[]
  status: ArtworkStatus
  featured: boolean
}

import { describe, expect, it } from 'vitest'
import { artworks, featuredArtworks, findArtwork } from '../../app/data/artworks'
import { formatDimensions, isPurchasable } from '../../shared/utils/artwork'

describe('artwork utils', () => {
  it('formats dimensions as height × width (× depth), per locale', () => {
    expect(formatDimensions(null)).toBeNull()
    expect(formatDimensions({ widthCm: 80, heightCm: 100 })).toBe('100 × 80 cm')
    expect(formatDimensions({ widthCm: 80, heightCm: 100.5, depthCm: 4 })).toBe('100.5 × 80 × 4 cm')
    expect(formatDimensions({ widthCm: 80, heightCm: 100.5 }, 'es')).toBe('100,5 × 80 cm')
  })

  it('only available works are purchasable', () => {
    expect(isPurchasable({ status: 'available' })).toBe(true)
    expect(isPurchasable({ status: 'sold' })).toBe(false)
    expect(isPurchasable({ status: 'archived' })).toBe(false)
  })
})

describe('artwork data', () => {
  it('has unique slugs and ids', () => {
    expect(new Set(artworks.map((a) => a.slug)).size).toBe(artworks.length)
    expect(new Set(artworks.map((a) => a.id)).size).toBe(artworks.length)
  })

  it('the three supplied paintings are sold and can never be checked out', () => {
    expect(featuredArtworks).toHaveLength(3)
    for (const a of featuredArtworks) {
      expect(a.status).toBe('sold')
      expect(isPurchasable(a)).toBe(false)
    }
  })

  it('never invents data: unknown fields stay null', () => {
    for (const a of featuredArtworks) {
      expect(a.title).toBeNull()
      expect(a.year).toBeNull()
    }
  })

  it('finds by slug', () => {
    expect(findArtwork('painting-001')?.id).toBe('painting-001')
    expect(findArtwork('nope')).toBeUndefined()
  })
})

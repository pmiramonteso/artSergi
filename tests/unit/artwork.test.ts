import { describe, expect, it } from 'vitest'
import { artworks, featuredArtworks, findArtwork } from '../../app/data/artworks'
import { artworkTitle, formatDimensions, isPurchasable, PENDING } from '../../shared/utils/artwork'

describe('artwork utils', () => {
  it('never makes up a title', () => {
    expect(artworkTitle({ title: null })).toMatch(/pending/i)
    expect(artworkTitle({ title: 'Real title' })).toBe('Real title')
  })

  it('formats dimensions as height × width (× depth)', () => {
    expect(formatDimensions(null)).toBe(PENDING)
    expect(formatDimensions({ widthCm: 80, heightCm: 100 })).toBe('100 × 80 cm')
    expect(formatDimensions({ widthCm: 80, heightCm: 100.5, depthCm: 4 })).toBe('100.5 × 80 × 4 cm')
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

  it('finds by slug', () => {
    expect(findArtwork('painting-001')?.id).toBe('painting-001')
    expect(findArtwork('nope')).toBeUndefined()
  })
})

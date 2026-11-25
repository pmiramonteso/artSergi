import { describe, expect, it } from 'vitest'
import { artworks } from '../../app/data/artworks'
import { heroLettering, toHeroSlots } from '../../app/data/hero'

describe('hero content', () => {
  const slots = toHeroSlots(artworks)

  it('uses the first three featured artworks, positions 1–3', () => {
    expect(slots).toHaveLength(3)
    expect(slots.map((s) => s.position)).toEqual([1, 2, 3])
    expect(new Set(slots.map((s) => s.id)).size).toBe(3)
  })

  it('every supplied image has real dimensions and non-empty alt text', () => {
    const images = [...slots.map((a) => a.image), heroLettering].filter((i) => i !== null)
    for (const image of images) {
      expect(image.src).toMatch(/^\//)
      expect(image.width).toBeGreaterThan(0)
      expect(image.height).toBeGreaterThan(0)
      expect(image.alt.trim()).not.toBe('')
    }
  })
})

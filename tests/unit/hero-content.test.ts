import { describe, expect, it } from 'vitest'
import { heroArtworks, heroLettering } from '../../app/data/hero'

describe('hero content', () => {
  it('has exactly three artwork slots with unique ids', () => {
    expect(heroArtworks).toHaveLength(3)
    expect(new Set(heroArtworks.map((a) => a.id)).size).toBe(3)
  })

  it('every supplied image has real dimensions and non-empty alt text', () => {
    const images = [...heroArtworks.map((a) => a.image), heroLettering].filter((i) => i !== null)
    for (const image of images) {
      expect(image.src).toMatch(/^\//)
      expect(image.width).toBeGreaterThan(0)
      expect(image.height).toBeGreaterThan(0)
      expect(image.alt.trim()).not.toBe('')
    }
  })

  it('placeholders are clearly labeled', () => {
    for (const a of heroArtworks.filter((x) => x.image === null)) {
      expect(a.placeholderLabel).toMatch(/pending/i)
    }
  })
})

import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { artworkSources } from '../../app/data/artworks'
import { LOCALE_CODES } from '../../shared/constants/i18n'

const publicFile = (p: string) => fileURLToPath(new URL(`../../public${p}`, import.meta.url))

describe.each(artworkSources.filter((a) => a.image))('$slug image', (a) => {
  const image = a.image!

  it('has alt text in every locale', () => {
    for (const l of LOCALE_CODES) expect(image.alt[l].trim().length).toBeGreaterThan(20)
  })

  it('every referenced file exists (src and srcset)', () => {
    const files = [
      image.src,
      ...(image.srcset ?? '').split(',').map((c) => c.trim().split(' ')[0]!),
    ]
    for (const f of files.filter(Boolean)) expect(existsSync(publicFile(f)), f).toBe(true)
  })

  it('declares real dimensions', () => {
    expect(image.width).toBeGreaterThan(0)
    expect(image.height).toBeGreaterThan(0)
  })
})

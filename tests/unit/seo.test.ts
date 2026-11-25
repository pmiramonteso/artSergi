import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOCALES, localizedPath } from '../../shared/constants/i18n'
import { buildSitemap } from '../../shared/utils/sitemap'
import {
  breadcrumbJsonLd,
  personJsonLd,
  visualArtworkJsonLd,
} from '../../shared/utils/structured-data'
import type { Artwork } from '../../shared/types/artwork'

const base: Artwork = {
  id: 'p1',
  slug: 'p1',
  title: null,
  description: null,
  year: null,
  medium: null,
  dimensions: null,
  image: null,
  gallery: [],
  status: 'sold',
  featured: true,
}

describe('localized paths', () => {
  it('prefixes every locale and localizes segments', () => {
    expect(localizedPath('en', 'index')).toBe('/en')
    expect(localizedPath('es', 'works')).toBe('/es/obras')
    expect(localizedPath('ca', 'works-slug', { slug: 'painting-001' })).toBe(
      '/ca/obres/painting-001',
    )
  })
  it('requires route params', () => {
    expect(() => localizedPath('en', 'works-slug')).toThrow()
  })
})

describe('locale messages', () => {
  const load = (code: string) =>
    JSON.parse(
      readFileSync(
        fileURLToPath(new URL(`../../i18n/locales/${code}.json`, import.meta.url)),
        'utf8',
      ),
    )
  const keys = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === 'object'
        ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
        : [`${prefix}${k}`],
    )
  const en = keys(load('en')).sort()

  it.each(LOCALES.map((l) => l.code))('%s has exactly the same keys as en', (code) => {
    expect(keys(load(code)).sort()).toEqual(en)
  })
})

describe('structured data', () => {
  it('does not publish an artwork without a confirmed title', () => {
    expect(
      visualArtworkJsonLd(base, { url: 'https://x/en', origin: 'https://x', inLanguage: 'en' }),
    ).toBeNull()
  })

  it('publishes only supplied facts', () => {
    const ld = visualArtworkJsonLd(
      { ...base, title: 'Real', year: 2024 },
      { url: 'https://x/en/works/p1', origin: 'https://x', inLanguage: 'en' },
    )!
    expect(ld.name).toBe('Real')
    expect(ld.dateCreated).toBe('2024')
    expect(ld).not.toHaveProperty('artMedium')
    expect(ld).not.toHaveProperty('image')
    expect(ld).not.toHaveProperty('offers')
  })

  it('omits sameAs when no social profiles are confirmed', () => {
    expect(personJsonLd({ url: 'https://x/en' })).not.toHaveProperty('sameAs')
  })

  it('numbers breadcrumb items from 1', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Home', url: 'https://x/en' },
      { name: 'Works', url: 'https://x/en/works' },
    ])
    expect((ld.itemListElement as Array<{ position: number }>).map((i) => i.position)).toEqual([
      1, 2,
    ])
  })
})

describe('sitemap', () => {
  const xml = buildSitemap('https://example.com', [{ page: 'works' }], 'en')
  it('lists every locale with hreflang alternates and x-default', () => {
    expect(xml).toContain('<loc>https://example.com/en/works</loc>')
    expect(xml).toContain('<loc>https://example.com/es/obras</loc>')
    expect(xml).toContain('<loc>https://example.com/ca/obres</loc>')
    expect(xml).toContain('hreflang="x-default" href="https://example.com/en/works"')
    expect(xml.match(/<url>/g)).toHaveLength(3)
  })
})

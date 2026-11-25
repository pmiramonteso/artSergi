import type { LOCALIZED_PAGES, LocaleCode } from '../constants/i18n'
import { LOCALES, localizedPath } from '../constants/i18n'

export interface SitemapEntry {
  page: keyof typeof LOCALIZED_PAGES | 'index'
  params?: Record<string, string>
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * XML sitemap with one <url> per locale and xhtml:link hreflang alternates
 * (including x-default → default locale). Only indexable pages belong here.
 */
export function buildSitemap(origin: string, entries: SitemapEntry[], defaultLocale: LocaleCode) {
  const urls: string[] = []
  for (const entry of entries) {
    const hrefs = Object.fromEntries(
      LOCALES.map((l) => [l.code, origin + localizedPath(l.code, entry.page, entry.params)]),
    ) as Record<LocaleCode, string>
    const alternates = [
      ...LOCALES.map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l.language}" href="${esc(hrefs[l.code])}"/>`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(hrefs[defaultLocale])}"/>`,
    ].join('\n')
    for (const l of LOCALES) {
      urls.push(`  <url>\n    <loc>${esc(hrefs[l.code])}</loc>\n${alternates}\n  </url>`)
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
}

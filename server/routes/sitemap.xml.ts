import { DEFAULT_LOCALE } from '#shared/constants/i18n'
import { buildSitemap, type SitemapEntry } from '#shared/utils/sitemap'
import { artworks } from '~~/app/data/artworks'

/**
 * /sitemap.xml: indexable pages in every locale with hreflang alternates.
 * Legal stubs and the internal design-system page are excluded (noindex).
 */
export default defineEventHandler((event) => {
  const entries: SitemapEntry[] = [
    { page: 'index' },
    { page: 'works' },
    ...artworks.map((a) => ({ page: 'works-slug' as const, params: { slug: a.slug } })),
  ]
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return buildSitemap(siteOrigin(event), entries, DEFAULT_LOCALE)
})

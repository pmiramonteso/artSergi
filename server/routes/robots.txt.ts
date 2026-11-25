/**
 * /robots.txt: environment-aware. Previews/staging disallow everything;
 * production (NUXT_PUBLIC_SITE_INDEXABLE=true) allows crawling and points to
 * the sitemap. Internal/utility paths are always disallowed.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  if (!isIndexable(event)) {
    return 'User-agent: *\nDisallow: /\n'
  }
  return [
    'User-agent: *',
    'Disallow: /api/',
    'Disallow: /design-system',
    '',
    `Sitemap: ${siteOrigin(event)}/sitemap.xml`,
    '',
  ].join('\n')
})

/**
 * Keeps every non-production deployment out of search engines.
 * Only when NUXT_PUBLIC_SITE_INDEXABLE=true is the header omitted
 * (Nuxt parses env overrides, so "true" arrives as a boolean).
 */
export default defineEventHandler((event) => {
  const { siteIndexable } = useRuntimeConfig(event).public
  if (siteIndexable !== true) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})

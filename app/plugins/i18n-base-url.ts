import { normalizeSiteUrl } from '#shared/utils/site-url'

/**
 * Single source for the site origin: NUXT_PUBLIC_SITE_URL.
 * @nuxtjs/i18n reads `public.i18n.baseUrl` for absolute canonical/hreflang
 * URLs; copy the validated site URL into it per request, before the i18n
 * plugin initialises (enforce: 'pre'). Without a configured URL, hreflang
 * falls back to the request origin.
 */
export default defineNuxtPlugin({
  name: 'site:i18n-base-url',
  enforce: 'pre',
  setup(nuxtApp) {
    const pub = nuxtApp.$config.public as {
      siteUrl?: string
      i18n?: { baseUrl?: unknown }
    }
    const site =
      normalizeSiteUrl(pub.siteUrl) ??
      (import.meta.server ? useRequestURL().origin : window.location.origin)
    if (pub.i18n && !pub.i18n.baseUrl) pub.i18n.baseUrl = site
  },
})

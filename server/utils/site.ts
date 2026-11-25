import type { H3Event } from 'h3'
import { normalizeSiteUrl } from '#shared/utils/site-url'

/** Configured site origin, or the request origin when not configured. */
export function siteOrigin(event: H3Event): string {
  const { siteUrl } = useRuntimeConfig(event).public
  return normalizeSiteUrl(siteUrl) ?? getRequestURL(event).origin
}

export function isIndexable(event: H3Event): boolean {
  return useRuntimeConfig(event).public.siteIndexable === true
}

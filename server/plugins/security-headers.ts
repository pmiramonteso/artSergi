import { randomBytes } from 'node:crypto'
import { normalizeSiteUrl } from '#shared/utils/site-url'
import {
  addNonce,
  baseSecurityHeaders,
  contentSecurityPolicy,
} from '#shared/utils/security-headers'

/**
 * Production security headers. In development they are skipped (Vite HMR
 * needs inline/eval scripts and websockets).
 */
export default defineNitroPlugin((nitro) => {
  if (import.meta.dev) return

  nitro.hooks.hook('request', (event) => {
    const site = normalizeSiteUrl(useRuntimeConfig(event).public.siteUrl)
    const https = (site ?? getRequestURL(event).origin).startsWith('https://')
    setResponseHeaders(event, baseSecurityHeaders({ https }))
    if (event.path.startsWith('/api/')) {
      // JSON APIs never render documents.
      setResponseHeader(
        event,
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'",
      )
    }
  })

  nitro.hooks.hook('render:html', (html, { event }) => {
    const nonce = randomBytes(16).toString('base64')
    event.context.cspNonce = nonce
    html.head = html.head.map((s) => addNonce(s, nonce))
    html.bodyPrepend = html.bodyPrepend.map((s) => addNonce(s, nonce))
    html.body = html.body.map((s) => addNonce(s, nonce))
    html.bodyAppend = html.bodyAppend.map((s) => addNonce(s, nonce))
  })

  nitro.hooks.hook('render:response', (response, { event }) => {
    const nonce = event.context.cspNonce as string | undefined
    if (!nonce) return
    const site = normalizeSiteUrl(useRuntimeConfig(event).public.siteUrl)
    const https = (site ?? getRequestURL(event).origin).startsWith('https://')
    response.headers = {
      ...response.headers,
      'Content-Security-Policy': contentSecurityPolicy(nonce, { upgradeInsecure: https }),
      // HTML is per-request (nonce, session): never in shared caches, always
      // revalidated; 'no-cache' (not 'no-store') keeps back/forward cache working.
      'Cache-Control': 'private, no-cache',
    }
  })
})

/**
 * HTTP security headers. Pure so they can be unit-tested.
 *
 * CSP for HTML documents: scripts only from our origin or inline scripts
 * carrying the per-request nonce ('strict-dynamic' lets those load GSAP and
 * other lazy chunks). No 'unsafe-inline' / 'unsafe-eval' for scripts.
 * Style ATTRIBUTES are allowed ('unsafe-inline' scoped to style-src-attr)
 * because SSR renders style="" for layout/animation; <style> elements need
 * the nonce. Payments use Stripe-hosted Checkout (a redirect), so no
 * Stripe origins are needed here.
 */
export function contentSecurityPolicy(nonce: string, opts: { upgradeInsecure: boolean }) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    ...(opts.upgradeInsecure ? ['upgrade-insecure-requests'] : []),
  ]
  return directives.join('; ')
}

/** Headers for every response (HTML and API). */
export function baseSecurityHeaders(opts: { https: boolean }): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    ...(opts.https ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
  }
}

/** Add the nonce to every inline/external <script> and <style> tag lacking one. */
export function addNonce(html: string, nonce: string): string {
  return html.replace(/<(script|style)\b(?![^>]*\snonce=)/gi, `<$1 nonce="${nonce}"`)
}

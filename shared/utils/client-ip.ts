/**
 * Client IP for rate limiting, resistant to spoofing.
 *
 * - '' (default): the TCP peer address. Correct when nothing sits in front.
 * - 'cf-connecting-ip' / 'x-real-ip': a single value set by OUR proxy
 *   (Cloudflare / the hosting reverse proxy). Recommended behind a proxy.
 * - 'x-forwarded-for': the LAST entry, i.e. the hop added by our own proxy.
 *   The FIRST entry is client-controlled and must never be trusted.
 */
export type ClientIpHeader = '' | 'cf-connecting-ip' | 'x-real-ip' | 'x-forwarded-for'

export function normalizeClientIpHeader(value: unknown): ClientIpHeader {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return v === 'cf-connecting-ip' || v === 'x-real-ip' || v === 'x-forwarded-for' ? v : ''
}

export function resolveClientIp(
  header: ClientIpHeader,
  headerValue: string | null | undefined,
  peer: string | null | undefined,
): string {
  if (header && headerValue) {
    const candidate =
      header === 'x-forwarded-for'
        ? headerValue
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .at(-1)
        : headerValue.trim()
    if (candidate && /^[0-9a-f.:]{3,45}$/i.test(candidate)) return candidate
  }
  return peer || 'unknown'
}

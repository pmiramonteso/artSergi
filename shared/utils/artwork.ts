import type { Artwork, ArtworkDimensions } from '../types/artwork'

/**
 * "100 × 80 cm" (height × width, the usual convention) or "100 × 80 × 4 cm",
 * formatted for `locale`. Returns `null` when not supplied yet, so the UI can
 * show its localized "to be confirmed" text instead of inventing a value.
 */
export function formatDimensions(d: ArtworkDimensions | null, locale = 'en'): string | null {
  if (!d) return null
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const parts = [d.heightCm, d.widthCm, ...(d.depthCm ? [d.depthCm] : [])].map((n) => fmt.format(n))
  return `${parts.join(' × ')} cm`
}

/**
 * Whether an artwork may ever be offered for checkout. Sold and archived
 * works never are. Commerce is not enabled yet (Phase 8), so this is the
 * single gate the shop must call.
 */
export function isPurchasable(artwork: Pick<Artwork, 'status'>): boolean {
  return artwork.status === 'available'
}

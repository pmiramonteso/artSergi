import type { Artwork, ArtworkDimensions, ArtworkStatus } from '../types/artwork'

export const PENDING = 'To be confirmed'

export function artworkTitle(artwork: Pick<Artwork, 'title'>): string {
  return artwork.title ?? 'Untitled (title pending)'
}

/** "100 × 80 cm" (height × width, the usual convention) or "100 × 80 × 4 cm". */
export function formatDimensions(d: ArtworkDimensions | null): string {
  if (!d) return PENDING
  const fmt = (n: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(n)
  const parts = [d.heightCm, d.widthCm, ...(d.depthCm ? [d.depthCm] : [])].map(fmt)
  return `${parts.join(' × ')} cm`
}

export const statusLabel: Record<ArtworkStatus, string> = {
  available: 'Available',
  sold: 'Sold',
  archived: 'Archive',
}

/**
 * Whether an artwork may ever be offered for checkout. Sold and archived
 * works never are. Commerce is not enabled yet (Phase 8), so this is the
 * single gate the shop must call.
 */
export function isPurchasable(artwork: Pick<Artwork, 'status'>): boolean {
  return artwork.status === 'available'
}

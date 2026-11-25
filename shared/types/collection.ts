import type { LocalizedText } from '../constants/i18n'

export interface CollectionItem {
  name: string
  detail: LocalizedText
}

/** Public collection model (all locales included; small and cacheable). */
export interface Collection {
  slug: string
  number: string
  title: string
  tagline: LocalizedText
  description: LocalizedText
  contents: CollectionItem[]
  /** Pilot inventory size. Live stock is validated server-side (Phase 8). */
  editionSize: number
  accent: 'tomato' | 'electric-blue' | 'butter'
}

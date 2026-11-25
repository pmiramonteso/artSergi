/**
 * Collections. Copy below comes from the approved business brief (concept,
 * contents, pilot size). Imagery is pending: placeholders are shown.
 */
export interface CollectionItem {
  name: string
  detail: string
}

export interface Collection {
  slug: string
  number: string
  title: string
  tagline: string
  description: string
  contents: CollectionItem[]
  /** Pilot inventory. Real stock will be validated server-side (Phase 8). */
  editionSize: number
  accent: 'tomato' | 'electric-blue' | 'butter'
}

export const currentCollection: Collection = {
  slug: 'places-we-keep',
  number: 'Nº 001',
  title: 'Places We Keep',
  tagline: 'Small places, big feelings.',
  description:
    'A collection about physical, imaginary and emotional places, seen through Sergi’s surreal visual language: imaginary houses, dreamlike landscapes, symbolic objects and unexpected everyday scenes.',
  contents: [
    { name: 'Art Card', detail: 'A6 · original artistic composition' },
    { name: 'Sticker Set', detail: 'Three original designs from the collection' },
    { name: 'Story Card', detail: 'A7 · a short text or story' },
    { name: 'Collector Detail', detail: 'A small numbered label, stamp or mini illustration' },
    { name: 'Envelope', detail: 'Paper packaging with a brand seal' },
  ],
  editionSize: 50,
  accent: 'tomato',
}

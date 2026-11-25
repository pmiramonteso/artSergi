import type { Collection } from '#shared/types/collection'

export type { Collection, CollectionItem } from '#shared/types/collection'

/**
 * Collections. Copy comes from the approved business brief (concept,
 * contents, pilot size), translated to ES/CA (pending native review,
 * OPEN_QUESTIONS A10). Imagery is pending: placeholders are shown.
 * This is also the seed source for the database (server/database/seed.ts)
 * and the fallback content when no database is configured.
 */
export const currentCollection: Collection = {
  slug: 'places-we-keep',
  number: 'Nº 001',
  title: 'Places We Keep',
  tagline: {
    en: 'Small places, big feelings.',
    es: 'Lugares pequeños, grandes emociones.',
    ca: 'Llocs petits, grans emocions.',
  },
  description: {
    en: 'A collection about physical, imaginary and emotional places, seen through Sergi’s surreal visual language: imaginary houses, dreamlike landscapes, symbolic objects and unexpected everyday scenes.',
    es: 'Una colección sobre lugares físicos, imaginarios y emocionales, vistos a través del lenguaje visual surrealista de Sergi: casas imaginarias, paisajes oníricos, objetos simbólicos y escenas cotidianas inesperadas.',
    ca: 'Una col·lecció sobre llocs físics, imaginaris i emocionals, vistos a través del llenguatge visual surrealista d’en Sergi: cases imaginàries, paisatges onírics, objectes simbòlics i escenes quotidianes inesperades.',
  },
  contents: [
    {
      name: 'Art Card',
      detail: {
        en: 'A6 · original artistic composition',
        es: 'A6 · composición artística original',
        ca: 'A6 · composició artística original',
      },
    },
    {
      name: 'Sticker Set',
      detail: {
        en: 'Three original designs from the collection',
        es: 'Tres diseños originales de la colección',
        ca: 'Tres dissenys originals de la col·lecció',
      },
    },
    {
      name: 'Story Card',
      detail: {
        en: 'A7 · a short text or story',
        es: 'A7 · un texto o historia breve',
        ca: 'A7 · un text o història breu',
      },
    },
    {
      name: 'Collector Detail',
      detail: {
        en: 'A small numbered label, stamp or mini illustration',
        es: 'Una pequeña etiqueta numerada, sello o mini ilustración',
        ca: 'Una petita etiqueta numerada, segell o mini il·lustració',
      },
    },
    {
      name: 'Envelope',
      detail: {
        en: 'Paper packaging with a brand seal',
        es: 'Embalaje de papel con sello de la marca',
        ca: 'Embalatge de paper amb segell de la marca',
      },
    },
  ],
  editionSize: 50,
  accent: 'tomato',
}

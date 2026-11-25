import type { LocalizedText } from '../../shared/constants/i18n'

/**
 * Artist photos. Original: assets-src/artist/portrait/original.jpg (supplied
 * 2026-11-25); web versions built with `npm run images` (metadata stripped).
 * Alt text describes only what is visible.
 */
export interface ArtistPhoto {
  src: string
  srcset: string
  width: number
  height: number
  alt: LocalizedText
}

const base = '/images/artist/portrait/artist-portrait-studio'

export const artistPortrait: ArtistPhoto | null = {
  src: `${base}-960.webp`,
  srcset: `${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1400.webp 1400w`,
  width: 960,
  height: 1267,
  alt: {
    en: 'Sergi Tugas in his studio, wearing a paint-splattered white T-shirt and looking down at a large paintbrush in his hands. Canvases and framed paintings cover the wall behind him, and brushes and paint jars sit out of focus in the foreground.',
    es: 'Sergi Tugas en su estudio, con una camiseta blanca manchada de pintura, mirando un pincel grande que sostiene con las manos. Detrás, la pared está llena de lienzos y cuadros enmarcados; en primer plano, desenfocados, pinceles y botes de pintura.',
    ca: 'Sergi Tugas al seu estudi, amb una samarreta blanca tacada de pintura, mirant un pinzell gran que sosté amb les mans. Darrere, la paret és plena de llenços i quadres emmarcats; en primer pla, desenfocats, pinzells i pots de pintura.',
  },
}

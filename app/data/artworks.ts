import type { Artwork, ArtworkImage } from '#shared/types/artwork'
import { DEFAULT_LOCALE, type LocaleCode, type LocalizedText } from '../../shared/constants/i18n'

/**
 * Artworks served when no database is configured, and the seed source.
 *
 * The three paintings Sergi supplied (2026-11-25). They are SOLD.
 * Photos: preserved originals in assets-src/artworks/, web derivatives built
 * with `npm run images:artworks`. They are WhatsApp-compressed, so
 * higher-resolution photos are still requested (OPEN_QUESTIONS A1).
 *
 * Titles, years, media, dimensions and descriptions stay `null`: they must
 * come from the artist, never be made up (A2). Alt text describes only what
 * is visible in the photo, with no interpretation.
 */
export interface ArtworkSource extends Omit<Artwork, 'image'> {
  image: (Omit<ArtworkImage, 'alt'> & { alt: LocalizedText }) | null
}

const img = (slug: string, name: string, full: [number, number], alt: LocalizedText) => ({
  src: `/images/artworks/${slug}/artwork-${name}-${full[0]}.webp`,
  srcset: `/images/artworks/${slug}/artwork-${name}-480.webp 480w, /images/artworks/${slug}/artwork-${name}-${full[0]}.webp ${full[0]}w`,
  width: full[0],
  height: full[1],
  alt,
})

const unknown = { title: null, description: null, year: null, medium: null, dimensions: null }

export const artworkSources: ArtworkSource[] = [
  {
    id: 'painting-001',
    slug: 'painting-001',
    ...unknown,
    image: img('painting-001', 'car-suitcases', [610, 800], {
      en: 'Painting of an old car in a blue parking space in a red desert, carrying a towering pile of suitcases and boxes labelled with words such as “Debts”, “Fees”, “Taxed”, “Subscribed”, “FOMO”, “Deadline” and “Pay to win”. A suitcase at the top sticks out over the black frame.',
      es: 'Pintura de un coche antiguo en una plaza de aparcamiento azul en un desierto rojo, cargado con una enorme pila de maletas y cajas con palabras como «Debts», «Fees», «Taxed», «Subscribed», «FOMO», «Deadline» y «Pay to win». Una maleta de la cima sobresale por encima del marco negro.',
      ca: 'Pintura d’un cotxe antic en una plaça d’aparcament blava en un desert vermell, carregat amb una enorme pila de maletes i caixes amb paraules com «Debts», «Fees», «Taxed», «Subscribed», «FOMO», «Deadline» i «Pay to win». Una maleta del capdamunt sobresurt per sobre del marc negre.',
    }),
    gallery: [],
    status: 'sold',
    featured: true,
  },
  {
    id: 'painting-002',
    slug: 'painting-002',
    ...unknown,
    image: img('painting-002', 'cloud-climber', [668, 800], {
      en: 'Painting of a blue figure patterned with clouds and wearing a brown backpack, hanging by one hand from a small cloud tied with rope, where the dark starry sky opens like fabric. Below, a small house with a “Scene 3” sign stands on cracked desert ground.',
      es: 'Pintura de una figura azul estampada con nubes y con una mochila marrón, colgada de una mano de una pequeña nube atada con cuerda, donde el cielo oscuro y estrellado se abre como una tela. Abajo, una casita con un cartel «Scene 3» sobre un suelo desértico agrietado.',
      ca: 'Pintura d’una figura blava estampada amb núvols i amb una motxilla marró, penjada d’una mà d’un petit núvol lligat amb corda, on el cel fosc i estrellat s’obre com una tela. A baix, una caseta amb un rètol «Scene 3» sobre un terra desèrtic esquerdat.',
    }),
    gallery: [],
    status: 'sold',
    featured: true,
  },
  {
    id: 'painting-003',
    slug: 'painting-003',
    ...unknown,
    image: img('painting-003', 'torn-memories', [628, 772], {
      en: 'Painting of torn paper fragments forming a collage of scenes: a starry night with a crescent moon, mountains at sunset, an aeroplane, a planet, a fire, toy blocks and a teddy bear. In the lower left, the silhouettes of an adult and a child walk hand in hand.',
      es: 'Pintura de fragmentos de papel rasgado que forman un collage de escenas: una noche estrellada con luna creciente, montañas al atardecer, un avión, un planeta, un fuego, bloques de juguete y un osito de peluche. Abajo a la izquierda, las siluetas de un adulto y un niño caminan de la mano.',
      ca: 'Pintura de fragments de paper esquinçat que formen un collage d’escenes: una nit estrellada amb lluna creixent, muntanyes a la posta de sol, un avió, un planeta, un foc, blocs de joguina i un osset de peluix. A baix a l’esquerra, les siluetes d’un adult i un infant caminen agafats de la mà.',
    }),
    gallery: [],
    status: 'sold',
    featured: true,
  },
]

/** Public Artwork for one locale (alt text localized). */
export function localizeArtwork(a: ArtworkSource, locale: LocaleCode): Artwork {
  return { ...a, image: a.image ? { ...a.image, alt: a.image.alt[locale] } : null }
}

/** Default-locale view, for code that does not depend on language. */
export const artworks: Artwork[] = artworkSources.map((a) => localizeArtwork(a, DEFAULT_LOCALE))
export const featuredArtworks = artworks.filter((a) => a.featured)

export function findArtwork(slug: string): Artwork | undefined {
  return artworks.find((a) => a.slug === slug)
}

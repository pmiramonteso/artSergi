import type { Artwork } from '#shared/types/artwork'
import type { Collection } from '#shared/types/collection'

/**
 * Content comes from the server API (database when configured, static
 * content otherwise). Keys include the locale so each language is cached
 * separately and deduplicated across components on the same page.
 */
export function useArtworks() {
  const { locale } = useI18n()
  return useFetch('/api/artworks', {
    query: { locale },
    key: computed(() => `artworks:${locale.value}`),
    transform: (res: { data: Artwork[] }) => res.data,
    default: () => [] as Artwork[],
  })
}

export function useArtwork(slug: MaybeRefOrGetter<string>) {
  const { locale } = useI18n()
  return useFetch(() => `/api/artworks/${encodeURIComponent(toValue(slug))}`, {
    query: { locale },
    key: computed(() => `artwork:${toValue(slug)}:${locale.value}`),
  })
}

export function useCollection(slug: string) {
  return useFetch<Collection>(`/api/collections/${encodeURIComponent(slug)}`, {
    key: `collection:${slug}`,
  })
}

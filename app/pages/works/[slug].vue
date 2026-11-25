<script setup lang="ts">
import { isPurchasable } from '#shared/utils/artwork'
import { breadcrumbJsonLd, visualArtworkJsonLd } from '#shared/utils/structured-data'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const requestUrl = useRequestURL()
const { public: config } = useRuntimeConfig()

const slug = computed(() => String(route.params.slug))
const { data: artwork, error } = await useArtwork(slug)
if (error.value || !artwork.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artwork not found', fatal: true })
}
const { data: all } = await useArtworks()
const index = computed(() =>
  Math.max(
    0,
    all.value.findIndex((a) => a.slug === slug.value),
  ),
)

const title = computed(() => artwork.value?.title ?? t('works.untitled'))
const description = computed(
  () => artwork.value?.description ?? t('meta.work.description', { title: title.value }),
)

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogImage: () => artwork.value?.image?.src,
})

// Structured data: only verified, visible facts (VisualArtwork needs a real title).
const origin = config.siteUrl || requestUrl.origin
const abs = (path: string) => new URL(path, origin).toString()
const jsonLd = computed(() =>
  [
    breadcrumbJsonLd([
      { name: t('nav.home'), url: abs(localePath('/')) },
      { name: t('nav.works'), url: abs(localePath('works')) },
      { name: title.value, url: abs(route.path) },
    ]),
    artwork.value &&
      visualArtworkJsonLd(artwork.value, {
        url: abs(route.path),
        origin,
        inLanguage: locale.value,
      }),
  ].filter(Boolean),
)
useHead({
  script: computed(() =>
    jsonLd.value.map((data) => ({ type: 'application/ld+json', innerHTML: JSON.stringify(data) })),
  ),
})
</script>

<template>
  <UiContainer v-if="artwork" class="grid gap-12 pt-32 pb-(--spacing-section) md:grid-cols-12">
    <nav :aria-label="$t('nav.breadcrumb')" class="text-sm md:col-span-12">
      <ol class="flex flex-wrap gap-2">
        <li>
          <NuxtLink :to="localePath('/')" class="hover:underline">{{ $t('nav.home') }}</NuxtLink> /
        </li>
        <li>
          <NuxtLink :to="localePath('works')" class="hover:underline">{{
            $t('nav.works')
          }}</NuxtLink>
          /
        </li>
        <li aria-current="page" class="opacity-80">{{ title }}</li>
      </ol>
    </nav>

    <div class="md:col-span-7">
      <ArtworkFigure :artwork="artwork" :index="index" eager />
    </div>

    <div class="flex flex-col gap-8 md:col-span-4 md:col-start-9">
      <div class="flex flex-col gap-4">
        <ArtworkStatus :status="artwork.status" class="self-start" />
        <h1 class="font-serif text-h1">{{ title }}</h1>
      </div>

      <ArtworkMeta :artwork="artwork" />

      <p v-if="artwork.description" class="max-w-(--container-prose)">
        {{ artwork.description }}
      </p>
      <UiPendingNote v-else :label="$t('works.descriptionPending')" />

      <p v-if="!isPurchasable(artwork)" class="border-l-2 border-ink pl-4 text-sm">
        {{ $t(`works.notForSale.${artwork.status}`) }}
      </p>

      <UiButton :to="localePath('works')" variant="ghost" class="self-start">
        {{ $t('works.backArrow') }}
      </UiButton>
    </div>
  </UiContainer>
</template>

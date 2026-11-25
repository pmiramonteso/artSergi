<script setup lang="ts">
import { artworks, findArtwork } from '~/data/artworks'
import { artworkTitle, isPurchasable } from '#shared/utils/artwork'

const route = useRoute()
const artwork = findArtwork(String(route.params.slug))
if (!artwork) {
  throw createError({ statusCode: 404, statusMessage: 'Artwork not found', fatal: true })
}

const index = artworks.indexOf(artwork)
const title = artworkTitle(artwork)

useSeoMeta({
  title,
  description: artwork.description ?? `${title}: a painting by Sergi Tugas.`,
})
</script>

<template>
  <UiContainer v-if="artwork" class="grid gap-12 pt-32 pb-(--spacing-section) md:grid-cols-12">
    <nav aria-label="Breadcrumb" class="text-sm md:col-span-12">
      <ol class="flex flex-wrap gap-2">
        <li><NuxtLink to="/" class="hover:underline">Home</NuxtLink> /</li>
        <li><NuxtLink to="/works" class="hover:underline">Works</NuxtLink> /</li>
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
      <UiPendingNote v-else label="Description pending from the artist" />

      <p v-if="!isPurchasable(artwork)" class="border-l-2 border-ink pl-4 text-sm">
        This work is {{ artwork.status === 'sold' ? 'sold' : 'in the archive' }} and is not
        available for purchase.
      </p>

      <UiButton to="/works" variant="ghost" class="self-start">← All works</UiButton>
    </div>
  </UiContainer>
</template>

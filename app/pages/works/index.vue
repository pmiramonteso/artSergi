<script setup lang="ts">
import { artworks } from '~/data/artworks'
import { artworkTitle } from '#shared/utils/artwork'

useSeoMeta({
  title: 'Works',
  description: 'Paintings by Sergi Tugas: available works and archive.',
})
</script>

<template>
  <UiContainer class="flex flex-col gap-16 pt-32 pb-(--spacing-section)">
    <UiSectionHeading :level="1" eyebrow="Paintings" title="Works">
      Original paintings, available and sold. More works will be added as they are photographed.
    </UiSectionHeading>

    <ul class="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3" role="list">
      <li v-for="(work, i) in artworks" :key="work.id">
        <NuxtLink :to="`/works/${work.slug}`" class="group flex flex-col gap-4">
          <ArtworkFigure :artwork="work" :index="i" :eager="i < 3" />
          <div class="flex items-start justify-between gap-4">
            <h2 class="font-serif text-h3 group-hover:underline">{{ artworkTitle(work) }}</h2>
            <ArtworkStatus :status="work.status" />
          </div>
        </NuxtLink>
      </li>
    </ul>
  </UiContainer>
</template>

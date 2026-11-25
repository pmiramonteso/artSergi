<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { data: artworks } = await useArtworks()

useSeoMeta({
  title: () => t('meta.works.title'),
  ogTitle: () => t('meta.works.title'),
  description: () => t('meta.works.description'),
  ogDescription: () => t('meta.works.description'),
})
</script>

<template>
  <UiContainer class="flex flex-col gap-16 pt-32 pb-(--spacing-section)">
    <UiSectionHeading :level="1" :eyebrow="$t('works.eyebrow')" :title="$t('works.all')">
      {{ $t('works.intro') }}
    </UiSectionHeading>

    <ul class="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3" role="list">
      <li v-for="(work, i) in artworks" :key="work.id">
        <NuxtLink
          :to="localePath({ name: 'works-slug', params: { slug: work.slug } })"
          class="group flex flex-col gap-4"
        >
          <ArtworkFigure :artwork="work" :index="i" :eager="i < 3" />
          <div class="flex items-start justify-between gap-4">
            <h2 class="font-serif text-h3 group-hover:underline">
              {{ work.title ?? $t('works.untitled') }}
            </h2>
            <ArtworkStatus :status="work.status" />
          </div>
        </NuxtLink>
      </li>
    </ul>
  </UiContainer>
</template>

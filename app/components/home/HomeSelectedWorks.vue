<script setup lang="ts">
import { featuredArtworks } from '~/data/artworks'

/**
 * 02 · Selected works: an asymmetric editorial layout (not identical shop
 * cards). Each work links to its detail page. The supplied works are sold.
 */
const localePath = useLocalePath()
const works = featuredArtworks.slice(0, 3)

// Column placement and vertical offset per position (desktop).
const layout = [
  'md:col-span-5 md:col-start-1',
  'md:col-span-4 md:col-start-8 md:mt-40',
  'md:col-span-4 md:col-start-3 md:mt-8',
]
const tilt = ['-rotate-1', 'rotate-2', '-rotate-2']
</script>

<template>
  <section
    id="works"
    data-canvas-scene="works"
    aria-labelledby="works-title"
    class="min-h-svh scroll-mt-16 py-(--spacing-section)"
  >
    <UiContainer class="flex flex-col gap-16">
      <div data-reveal class="flex flex-wrap items-end justify-between gap-6">
        <UiSectionHeading
          heading-id="works-title"
          number="02"
          :eyebrow="$t('works.eyebrow')"
          :title="$t('works.selected')"
        />
        <UiButton :to="localePath('/works')" variant="ghost">{{ $t('works.allArrow') }}</UiButton>
      </div>

      <ol class="grid gap-16 md:grid-cols-12 md:gap-8" role="list">
        <li v-for="(work, i) in works" :key="work.id" data-reveal :class="layout[i]">
          <NuxtLink
            :to="localePath({ name: 'works-slug', params: { slug: work.slug } })"
            class="group flex flex-col gap-4"
          >
            <ArtworkFigure
              :artwork="work"
              :index="i"
              :class="tilt[i]"
              class="transition-transform duration-(--duration-slow) ease-(--ease-out) group-hover:rotate-0"
            />
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-eyebrow text-electric-blue">
                  {{ $t('works.number', { n: String(i + 1).padStart(3, '0') }) }}
                </p>
                <h3 class="font-serif text-h3 group-hover:underline">
                  {{ work.title ?? $t('works.untitled') }}
                </h3>
              </div>
              <ArtworkStatus :status="work.status" />
            </div>
          </NuxtLink>
        </li>
      </ol>
    </UiContainer>
  </section>
</template>

<script setup lang="ts">
import type { HeroArtworkSlot } from '~/data/hero'

/**
 * One floating artwork in the hero: a framed photograph (or a labeled
 * placeholder until Sergi's photo exists). Nested wrappers keep scroll,
 * pointer parallax, floating and intro transforms independent.
 */
defineProps<{
  artwork: HeroArtworkSlot
  /** Pointer parallax depth, 0–1. */
  parallax: number
  /** Scroll transition depth, 0–1. */
  scrollDepth: number
  /** First artwork is the LCP candidate: load it eagerly with high priority. */
  priority?: boolean
}>()
</script>

<template>
  <div :data-hero-art="scrollDepth">
    <div :data-parallax="parallax">
      <div data-float>
        <div data-intro="art" class="motion-intro">
          <figure class="bg-paper p-[3.5%] shadow-float">
            <img
              v-if="artwork.image"
              :src="artwork.image.src"
              :width="artwork.image.width"
              :height="artwork.image.height"
              :alt="artwork.image.alt"
              :loading="priority ? 'eager' : 'lazy'"
              :fetchpriority="priority ? 'high' : 'auto'"
              decoding="async"
              class="block h-auto w-full"
            />
            <UiPlaceholder
              v-else
              :label="$t('hero.artworkPending', { n: artwork.position })"
              :ratio="artwork.ratio"
            />
          </figure>
        </div>
      </div>
    </div>
  </div>
</template>

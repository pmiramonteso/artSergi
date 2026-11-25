<script setup lang="ts">
import { heroLettering } from '~/data/hero'

/**
 * The artist name as the page's <h1>. Uses Sergi's handwritten SVG when it
 * exists; until then a typeset name, clearly labeled as a placeholder
 * (never a script font imitating handwriting).
 */
</script>

<template>
  <div data-hero-lettering class="relative">
    <h1 data-intro="lettering" class="motion-intro" data-parallax="0.15">
      <img
        v-if="heroLettering"
        :src="heroLettering.src"
        :width="heroLettering.width"
        :height="heroLettering.height"
        :alt="heroLettering.alt"
        fetchpriority="high"
        class="block h-auto w-[min(84vw,50rem)]"
      />
      <span
        v-else
        class="block text-center font-serif text-[clamp(3.5rem,1rem+16vw,6.5rem)] leading-[0.85] tracking-tight italic md:text-[clamp(5rem,1rem+11vw,10.5rem)]"
      >
        Sergi<br class="md:hidden" />
        Tugas
      </span>
    </h1>
  </div>
</template>

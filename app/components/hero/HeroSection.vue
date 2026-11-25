<script setup lang="ts">
import { heroArtworks } from '~/data/hero'
import { useHeroAnimation } from '~/composables/useHeroAnimation'
import { usePointerParallax } from '~/composables/usePointerParallax'
import { useIntroGate } from '~/composables/useIntroGate'

/**
 * Artist hero, "The Floating Studio": handwritten name in the centre and
 * three floating paintings around it, on top of the Living Canvas.
 * Desktop: 3 artworks + labels. Tablet: 3 smaller artworks. Mobile: 2 artworks,
 * no labels. The name always stays on top and readable.
 */
const root = ref<HTMLElement | null>(null)

useIntroGate()
useHeroAnimation(root)
usePointerParallax(root)

const [art1, art2, art3] = heroArtworks
</script>

<template>
  <section
    ref="root"
    data-canvas-scene="hero"
    aria-label="Sergi Tugas — artist"
    class="relative flex h-svh min-h-[36rem] items-center justify-center overflow-x-clip"
  >
    <!-- Artworks (decorative arrangement; real photos replace placeholders) -->
    <HeroArtwork
      v-if="art1"
      :artwork="art1"
      :parallax="0.6"
      :scroll-depth="0.6"
      priority
      class="absolute top-[13%] left-[5%] w-[34vw] -rotate-[5deg] md:top-[11%] md:left-[4%] md:w-[24vw] lg:w-[clamp(200px,19vw,320px)]"
    />
    <HeroArtwork
      v-if="art2"
      :artwork="art2"
      :parallax="1"
      :scroll-depth="1"
      class="absolute right-[5%] bottom-[15%] w-[30vw] rotate-[6deg] md:top-[30%] md:right-[6%] md:bottom-auto md:w-[19vw] lg:w-[clamp(150px,15vw,260px)]"
    />
    <HeroArtwork
      v-if="art3"
      :artwork="art3"
      :parallax="0.4"
      :scroll-depth="0.3"
      class="absolute bottom-[-10%] left-[13%] hidden w-[16vw] rotate-[3deg] md:block lg:w-[clamp(130px,13vw,220px)]"
    />

    <!-- Lettering: above the artworks so the name is never covered -->
    <div class="relative z-10 px-4">
      <HeroLettering />
    </div>

    <!-- Editorial details -->
    <div data-hero-decor class="pointer-events-none absolute inset-0 z-10">
      <div data-parallax="0.8" class="absolute top-[14%] left-[27%] hidden lg:block">
        <UiLabel data-intro="decor" class="motion-intro bg-paper">Original paintings</UiLabel>
      </div>
      <div data-parallax="0.9" class="absolute top-[24%] right-[6%] hidden md:block">
        <UiLabel tone="tomato" data-intro="decor" class="motion-intro">
          Art Mail Club · Nº 001
        </UiLabel>
      </div>
      <div data-parallax="0.5" class="absolute top-[62%] left-[58%] hidden md:block">
        <DecorStar data-intro="decor" class="motion-intro text-electric-blue" :size="22" />
      </div>
      <div
        data-parallax="0.7"
        class="absolute right-[24%] bottom-[16%] hidden -rotate-[24deg] lg:block"
      >
        <DecorArrow data-intro="decor" class="motion-intro text-ink" :width="72" />
      </div>
    </div>

    <div data-hero-decor class="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
      <HeroScrollIndicator target="#intro" data-intro="decor" class="motion-intro" />
    </div>
  </section>
</template>

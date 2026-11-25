<script setup lang="ts">
import { useRevealOnScroll } from '~/composables/useRevealOnScroll'

useSeoMeta({
  title: 'Art Studio',
  description:
    'Sergi Tugas: independent artist. Paintings, the Art Mail Club and the Places We Keep collection.',
})

const page = ref<HTMLElement | null>(null)
useRevealOnScroll(page)
</script>

<template>
  <div ref="page" class="relative isolate">
    <LivingCanvas />
    <HeroSection />
    <HomeIntro />
    <HomeSelectedWorks />
    <HomeArtMail />
    <HomeCollection />
    <HomeProcess />
    <HomeAnnual />
    <HomeNewsletter />
  </div>
</template>

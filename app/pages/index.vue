<script setup lang="ts">
import type { CanvasSceneName } from '~/utils/canvas-scenes'

useSeoMeta({
  title: 'Art Studio',
  description: 'Sergi Tugas Art Studio — site under construction.',
})

/**
 * Section skeleton in the final homepage order. The stubs only exist so the
 * Living Canvas transitions can be reviewed. Phase 5 replaces each one with
 * its real, independent section component.
 */
const stubs: Array<{ scene: CanvasSceneName; number: string; title: string }> = [
  { scene: 'intro', number: '01', title: 'Artist introduction' },
  { scene: 'works', number: '02', title: 'Selected works' },
  { scene: 'art-mail', number: '03', title: 'Art Mail Club' },
  { scene: 'collection', number: '04', title: 'Current collection' },
  { scene: 'process', number: '05', title: 'Studio process' },
  { scene: 'annual', number: '06', title: 'Annual original' },
  { scene: 'newsletter', number: '07', title: 'Newsletter' },
]
</script>

<template>
  <div class="relative isolate">
    <LivingCanvas />

    <HeroSection />

    <section
      v-for="stub in stubs"
      :id="stub.scene"
      :key="stub.scene"
      :data-canvas-scene="stub.scene"
      class="flex min-h-svh scroll-mt-16 items-center py-(--spacing-section)"
    >
      <UiContainer>
        <UiSectionHeading :number="stub.number" eyebrow="Section placeholder" :title="stub.title">
          Content arrives in Phase 5.
        </UiSectionHeading>
      </UiContainer>
    </section>
  </div>
</template>

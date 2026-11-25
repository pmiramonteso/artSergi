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

    <!-- Temporary hero. The real hero (lettering + floating artworks) is Phase 4. -->
    <section data-canvas-scene="hero" class="flex min-h-svh items-center">
      <UiContainer class="flex flex-col gap-8">
        <UiLabel class="self-start bg-paper">Work in progress · Phase 3</UiLabel>
        <div class="flex flex-col gap-2">
          <UiLabel tone="butter" class="self-start">Placeholder lettering</UiLabel>
          <h1 class="font-serif text-display italic">Sergi Tugas</h1>
        </div>
        <p class="max-w-(--container-prose) text-lead">
          Art Studio — under construction. Scroll down to see how the Living Canvas background moves
          between the homepage sections.
        </p>
        <div class="flex flex-wrap items-center gap-6">
          <DecorArrow class="hidden text-tomato-ink sm:block" />
          <UiButton to="/design-system" size="lg">See the design system</UiButton>
        </div>
      </UiContainer>
    </section>

    <section
      v-for="stub in stubs"
      :key="stub.scene"
      :data-canvas-scene="stub.scene"
      class="flex min-h-svh items-center py-(--spacing-section)"
    >
      <UiContainer>
        <UiSectionHeading :number="stub.number" eyebrow="Section placeholder" :title="stub.title">
          Content arrives in Phase 5.
        </UiSectionHeading>
      </UiContainer>
    </section>
  </div>
</template>

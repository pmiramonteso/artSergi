<script setup lang="ts">
/** 01 · Artist introduction. All copy is placeholder until Sergi approves it. */
</script>

<template>
  <section
    id="intro"
    data-canvas-scene="intro"
    aria-labelledby="intro-title"
    class="flex min-h-svh scroll-mt-16 items-center py-(--spacing-section)"
  >
    <UiContainer class="grid items-center gap-12 md:grid-cols-12 md:gap-8">
      <div data-reveal class="md:col-span-5 md:col-start-1">
        <figure class="max-w-sm -rotate-2 bg-paper p-3 shadow-float md:max-w-none">
          <UiPlaceholder label="Portrait or studio photo of Sergi" ratio="4 / 5" />
        </figure>
      </div>

      <div class="flex flex-col gap-8 md:col-span-6 md:col-start-7">
        <div data-reveal>
          <p class="mb-4 flex items-center gap-3 text-eyebrow">
            <span class="text-electric-blue">01</span>
            <span aria-hidden="true" class="h-px w-8 bg-ink" />
            <span>The artist</span>
          </p>
          <h2 id="intro-title" class="font-serif text-h2">
            Worlds, scenes and stories through painting
          </h2>
        </div>

        <blockquote data-reveal class="flex flex-col gap-3 border-l-2 border-tomato pl-5">
          <p class="font-serif text-h3 italic">
            “I create visual stories through painting, imagination and everyday objects. Each piece
            is a world of its own.”
          </p>
          <footer><UiPendingNote label="Placeholder: not an approved artist statement" /></footer>
        </blockquote>

        <div data-reveal class="flex flex-col gap-3">
          <p class="max-w-(--container-prose)">
            Sergi Tugas is an independent visual artist. His short biography will appear here once
            it has been written and approved with him.
          </p>
          <UiPendingNote label="Biography pending" />
        </div>
      </div>
    </UiContainer>
  </section>
</template>

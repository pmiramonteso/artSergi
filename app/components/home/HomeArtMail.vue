<script setup lang="ts">
/**
 * 03 · Art Mail Club: the collectible mail concept, with a floating paper
 * composition of the package contents. "Art Mail Club" is a working name,
 * and every image is a labeled placeholder until real product photos exist.
 */
const pieces = [
  {
    label: 'Envelope + seal',
    ratio: '162 / 114',
    cls: 'left-[4%] top-[30%] w-[62%] -rotate-3 z-0',
  },
  { label: 'A6 Art Card', ratio: '148 / 105', cls: 'right-[2%] top-[6%] w-[54%] rotate-6 z-10' },
  {
    label: 'A7 Story Card',
    ratio: '105 / 74',
    cls: 'right-[10%] bottom-[8%] w-[38%] -rotate-2 z-20',
  },
  {
    label: 'Collector detail',
    ratio: '1 / 1',
    cls: 'left-[10%] bottom-[6%] w-[20%] rotate-12 z-20',
    compact: true,
  },
]
const stickers = ['Sticker 1', 'Sticker 2', 'Sticker 3']
</script>

<template>
  <section
    id="art-mail"
    data-canvas-scene="art-mail"
    aria-labelledby="art-mail-title"
    class="flex min-h-svh scroll-mt-16 items-center py-(--spacing-section)"
  >
    <UiContainer class="grid items-center gap-16 md:grid-cols-12 md:gap-8">
      <div class="flex flex-col gap-8 md:col-span-5">
        <div data-reveal class="flex flex-col gap-4">
          <UiSectionHeading number="03" eyebrow="Art Mail Club" title="Collectible art, by post" />
          <UiPendingNote label="Working name: the club name is not chosen yet" />
        </div>
        <div data-reveal class="flex flex-col gap-4">
          <p class="text-lead">
            A small envelope from Sergi’s artistic universe: an illustrated card, stickers, a short
            story and a collector detail, gathered around one collection at a time.
          </p>
          <p>
            The club is planned as a monthly subscription, with single collections, gifts and
            special editions too. Details and pricing will be announced at launch.
          </p>
        </div>
        <div data-reveal>
          <UiButton to="/#collection" size="lg">Discover the first collection</UiButton>
        </div>
      </div>

      <div
        data-reveal
        class="relative mx-auto aspect-square w-full max-w-xl md:col-span-6 md:col-start-7"
        role="group"
        aria-label="Package contents (placeholder images)"
      >
        <div
          v-for="piece in pieces"
          :key="piece.label"
          class="absolute bg-paper p-2 shadow-float"
          :class="piece.cls"
        >
          <UiPlaceholder :label="piece.label" :ratio="piece.ratio" :compact="piece.compact" />
        </div>
        <ul class="absolute top-[4%] left-[6%] z-20 flex gap-2" aria-label="Sticker set">
          <li
            v-for="(s, i) in stickers"
            :key="s"
            class="flex size-14 items-center justify-center rounded-full border border-dashed border-ink/40 bg-paper text-[0.6rem] shadow-paper sm:size-16"
            :class="i === 1 ? 'translate-y-4 -rotate-6' : 'rotate-6'"
          >
            {{ s }}
          </li>
        </ul>
      </div>
    </UiContainer>
  </section>
</template>

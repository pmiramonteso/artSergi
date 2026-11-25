<script setup lang="ts">
/**
 * 03 · Art Mail Club: the collectible mail concept, with a floating paper
 * composition of the package contents. "Art Mail Club" is a working name,
 * and every image is a labeled placeholder until real product photos exist.
 */
const localePath = useLocalePath()

const pieces = [
  { key: 'envelope', ratio: '162 / 114', cls: 'left-[4%] top-[30%] w-[62%] -rotate-3 z-0' },
  { key: 'card', ratio: '148 / 105', cls: 'right-[2%] top-[6%] w-[54%] rotate-6 z-10' },
  { key: 'story', ratio: '105 / 74', cls: 'right-[10%] bottom-[8%] w-[38%] -rotate-2 z-20' },
  {
    key: 'detail',
    ratio: '1 / 1',
    cls: 'left-[10%] bottom-[6%] w-[20%] rotate-12 z-20',
    compact: true,
  },
] as const
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
          <UiSectionHeading
            heading-id="art-mail-title"
            number="03"
            :eyebrow="$t('artMail.eyebrow')"
            :title="$t('artMail.title')"
          />
          <UiPendingNote :label="$t('artMail.workingName')" />
        </div>
        <div data-reveal class="flex flex-col gap-4">
          <p class="text-lead">{{ $t('artMail.lead') }}</p>
          <p>{{ $t('artMail.body') }}</p>
        </div>
        <div data-reveal>
          <UiButton :to="{ path: localePath('/'), hash: '#collection' }" size="lg">
            {{ $t('artMail.cta') }}
          </UiButton>
        </div>
      </div>

      <div
        data-reveal
        class="relative mx-auto aspect-square w-full max-w-xl md:col-span-6 md:col-start-7"
        role="group"
        :aria-label="$t('artMail.contentsLabel')"
      >
        <div
          v-for="piece in pieces"
          :key="piece.key"
          class="absolute bg-paper p-2 shadow-float"
          :class="piece.cls"
        >
          <UiPlaceholder
            :label="$t(`artMail.pieces.${piece.key}`)"
            :ratio="piece.ratio"
            :compact="'compact' in piece"
          />
        </div>
        <ul
          class="absolute top-[4%] left-[6%] z-20 flex gap-2"
          :aria-label="$t('artMail.stickerSet')"
        >
          <li
            v-for="n in 3"
            :key="n"
            class="flex size-14 items-center justify-center rounded-full border border-dashed border-ink/40 bg-paper text-center text-[0.6rem] leading-tight shadow-paper sm:size-16"
            :class="n === 2 ? 'translate-y-4 -rotate-6' : 'rotate-6'"
          >
            {{ $t('artMail.pieces.sticker', { n }) }}
          </li>
        </ul>
      </div>
    </UiContainer>
  </section>
</template>

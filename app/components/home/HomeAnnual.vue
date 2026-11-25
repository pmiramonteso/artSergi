<script setup lang="ts">
/**
 * 06 · Annual original. Editorial only: no lottery, giveaway or prize
 * mechanism exists until a legal structure is approved.
 */
const localePath = useLocalePath()
</script>

<template>
  <section
    id="annual"
    data-canvas-scene="annual"
    aria-labelledby="annual-title"
    class="flex min-h-svh scroll-mt-16 items-center py-(--spacing-section)"
  >
    <UiContainer class="grid gap-10 md:grid-cols-12">
      <p
        data-reveal
        aria-hidden="true"
        class="font-serif text-[clamp(6rem,3rem+14vw,16rem)] leading-none italic md:col-span-5"
      >
        1<span class="text-tomato-ink">/</span>{{ $t('annual.perYear') }}
      </p>
      <div class="flex flex-col gap-6 md:col-span-6 md:col-start-7 md:self-center">
        <div data-reveal>
          <UiSectionHeading
            heading-id="annual-title"
            number="06"
            :eyebrow="$t('annual.eyebrow')"
            :title="$t('annual.title')"
          />
        </div>
        <p data-reveal class="text-lead">{{ $t('annual.body') }}</p>
        <div data-reveal class="flex flex-wrap items-center gap-4">
          <UiLabel>{{ $t('annual.details') }}</UiLabel>
          <UiButton :to="{ path: localePath('/'), hash: '#newsletter' }" variant="ghost">
            {{ $t('annual.notify') }}
          </UiButton>
        </div>
      </div>
    </UiContainer>
  </section>
</template>

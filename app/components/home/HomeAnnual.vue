<script setup lang="ts">
/**
 * 06 · Annual original. Editorial only: no lottery, giveaway or prize
 * mechanism exists until a legal structure is approved.
 */
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
        1<span class="text-tomato-ink">/</span>yr
      </p>
      <div class="flex flex-col gap-6 md:col-span-6 md:col-start-7 md:self-center">
        <div data-reveal>
          <UiSectionHeading
            number="06"
            eyebrow="Annual original"
            title="One original, once a year"
          />
        </div>
        <p data-reveal class="text-lead">
          An initiative around a single original painting each year. How it will work is still being
          defined, and it will be announced here first.
        </p>
        <div data-reveal class="flex flex-wrap items-center gap-4">
          <UiLabel>Details coming</UiLabel>
          <UiButton to="/#newsletter" variant="ghost">Get notified →</UiButton>
        </div>
      </div>
    </UiContainer>
  </section>
</template>

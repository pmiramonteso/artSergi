<script setup lang="ts">
useSeoMeta({
  title: 'Art Studio',
  description: 'Sergi Tugas Art Studio — site under construction.',
})
</script>

<template>
  <section class="relative isolate flex min-h-svh items-center overflow-hidden bg-grid">
    <!-- Temporary page. The real hero (Living Canvas + floating artworks) is Phase 3–4. -->
    <div
      aria-hidden="true"
      class="absolute top-[3%] -left-10 -z-10 h-28 w-48 -rotate-6 bg-electric-blue opacity-90 md:h-40 md:w-80"
    />
    <div
      aria-hidden="true"
      class="absolute right-[6%] bottom-[10%] -z-10 size-32 rounded-full bg-tomato md:size-52"
    />
    <div
      aria-hidden="true"
      class="absolute top-[18%] right-[18%] -z-10 hidden h-16 w-48 rotate-3 bg-butter md:block"
    />
    <DecorStar class="absolute top-[22%] left-[38%] text-ink" :size="28" />
    <DecorDots class="absolute bottom-[18%] left-[12%] text-electric-blue" />

    <UiContainer class="flex flex-col gap-8">
      <UiLabel class="self-start">Work in progress · Phase 2</UiLabel>
      <div class="flex flex-col gap-2">
        <UiLabel tone="butter" class="self-start">Placeholder lettering</UiLabel>
        <h1 class="font-serif text-display italic">Sergi Tugas</h1>
      </div>
      <p class="max-w-(--container-prose) text-lead">
        Art Studio — under construction. The handwritten artist lettering will replace this
        temporary typeset name.
      </p>
      <div class="flex flex-wrap items-center gap-6">
        <DecorArrow class="hidden text-tomato-ink sm:block" />
        <UiButton to="/design-system" size="lg">See the design system</UiButton>
      </div>
    </UiContainer>
  </section>
</template>

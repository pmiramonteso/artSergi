<script setup lang="ts">
useSeoMeta({
  title: 'Art Studio',
  description: 'Sergi Tugas Art Studio — site under construction.',
})
</script>

<template>
  <section class="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 px-6 py-24">
    <p class="text-sm tracking-[0.2em] uppercase opacity-70">Phase 1 · Technical foundation</p>
    <h1 class="text-5xl font-semibold tracking-tight sm:text-7xl">Sergi Tugas</h1>
    <p class="text-lg">Art Studio — under construction.</p>
    <ul class="flex flex-wrap gap-3" aria-label="Palette preview">
      <li class="h-10 w-10 rounded-full bg-electric-blue">
        <span class="sr-only">Electric blue</span>
      </li>
      <li class="h-10 w-10 rounded-full bg-tomato"><span class="sr-only">Tomato</span></li>
      <li class="h-10 w-10 rounded-full bg-butter"><span class="sr-only">Butter yellow</span></li>
      <li class="h-10 w-10 rounded-full bg-ink"><span class="sr-only">Ink</span></li>
    </ul>
  </section>
</template>

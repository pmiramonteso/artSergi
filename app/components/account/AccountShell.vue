<script setup lang="ts">
/** Narrow, centred card layout for account forms. Pages are never indexed. */
defineProps<{ title: string }>()
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
  <UiContainer class="flex min-h-[80svh] items-center justify-center py-32">
    <div class="w-full max-w-md bg-paper p-6 shadow-paper md:p-10">
      <h1 class="mb-8 font-serif text-h2">{{ title }}</h1>
      <slot />
    </div>
  </UiContainer>
</template>

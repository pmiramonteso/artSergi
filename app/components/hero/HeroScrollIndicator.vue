<script setup lang="ts">
/** "Scroll" cue linking to the first section after the hero. */
defineProps<{ target: string }>()
</script>

<template>
  <a :href="target" class="group flex flex-col items-center gap-3 text-eyebrow">
    <span class="bg-paper px-1">
      {{ $t('hero.scroll') }}<span class="sr-only">: {{ $t('hero.scrollLabel') }}</span>
    </span>
    <span class="relative block h-12 w-px overflow-hidden bg-ink/20" aria-hidden="true">
      <span class="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-ink" />
    </span>
  </a>
</template>

<style scoped>
.scroll-cue {
  animation: scroll-cue 2.2s var(--ease-in-out) infinite;
}
@keyframes scroll-cue {
  0% {
    transform: translateY(-100%);
  }
  60%,
  100% {
    transform: translateY(200%);
  }
}
</style>

<script setup lang="ts">
/** Small dot cluster. Decorative. Color = currentColor. */
withDefaults(defineProps<{ size?: number | string }>(), { size: 48 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="10" r="4" />
    <circle cx="26" cy="6" r="3" />
    <circle cx="40" cy="16" r="5" />
    <circle cx="14" cy="30" r="3" />
    <circle cx="32" cy="34" r="4" />
    <circle cx="10" cy="44" r="2.5" />
  </svg>
</template>

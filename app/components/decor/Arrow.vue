<script setup lang="ts">
/** Hand-drawn-style arrow pointing right (rotate with CSS as needed). Decorative. */
withDefaults(defineProps<{ width?: number | string }>(), { width: 64 })
</script>

<template>
  <svg
    :width="width"
    viewBox="0 0 64 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path pathLength="1" d="M2 14c14-4 30-5 56-2" />
    <path d="M48 4c4 3 7 5 11 8-4 2-8 5-12 9" />
  </svg>
</template>

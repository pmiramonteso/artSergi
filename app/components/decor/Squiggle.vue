<script setup lang="ts">
/**
 * Loose hand-drawn-style line. Generic system mark, not artist lettering.
 * Exposes `pathLength="1"` so GSAP can draw it via stroke-dashoffset.
 */
withDefaults(defineProps<{ width?: number | string; strokeWidth?: number }>(), {
  width: 160,
  strokeWidth: 2.5,
})
</script>

<template>
  <svg
    :width="width"
    viewBox="0 0 160 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      pathLength="1"
      d="M2 14c10-9 18-9 24 0s14 9 22 0 16-10 24-1 15 9 23 0 16-9 23 0 15 8 22 0 11-6 18-2"
    />
  </svg>
</template>

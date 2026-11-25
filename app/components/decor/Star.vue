<script setup lang="ts">
/** Four-point star mark. Decorative: hidden from assistive tech. Color = currentColor. */
withDefaults(defineProps<{ size?: number | string }>(), { size: 24 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M12 0c.9 6.4 3.2 9.6 12 12-8.8 2.4-11.1 5.6-12 12-.9-6.4-3.2-9.6-12-12 8.8-2.4 11.1-5.6 12-12Z"
    />
  </svg>
</template>

<script setup lang="ts">
/** Centered page column with responsive gutters (`page-container` utility). */
withDefaults(defineProps<{ as?: string }>(), { as: 'div' })
</script>

<template>
  <component :is="as" class="page-container">
    <slot />
  </component>
</template>

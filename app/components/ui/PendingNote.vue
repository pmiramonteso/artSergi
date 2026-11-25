<script setup lang="ts">
/**
 * Inline marker for copy that is a placeholder or still to be supplied by
 * the artist. Keeps temporary content visibly distinct from approved content.
 */
withDefaults(defineProps<{ label?: string }>(), { label: 'Placeholder copy' })
</script>

<template>
  <span class="inline-flex items-center gap-2 align-middle">
    <span class="bg-butter px-1.5 py-0.5 text-eyebrow text-ink">{{ label }}</span>
  </span>
</template>

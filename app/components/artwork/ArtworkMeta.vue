<script setup lang="ts">
import type { Artwork } from '#shared/types/artwork'
import { PENDING, formatDimensions } from '#shared/utils/artwork'

/** Year · medium · dimensions, showing "To be confirmed" for missing data. */
defineProps<{ artwork: Artwork }>()
</script>

<template>
  <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
    <dt class="text-eyebrow opacity-70">Year</dt>
    <dd>{{ artwork.year ?? PENDING }}</dd>
    <dt class="text-eyebrow opacity-70">Medium</dt>
    <dd>{{ artwork.medium ?? PENDING }}</dd>
    <dt class="text-eyebrow opacity-70">Size</dt>
    <dd>{{ formatDimensions(artwork.dimensions) }}</dd>
  </dl>
</template>

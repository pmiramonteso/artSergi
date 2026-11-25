<script setup lang="ts">
import type { ArtworkStatus } from '#shared/types/artwork'

defineProps<{ status: ArtworkStatus }>()

const tone = { available: 'blue', sold: 'ink', archived: 'outline' } as const
</script>

<template>
  <UiLabel :tone="tone[status]">{{ $t(`works.status.${status}`) }}</UiLabel>
</template>

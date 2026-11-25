<script setup lang="ts">
import type { ArtworkStatus } from '#shared/types/artwork'
import { statusLabel } from '#shared/utils/artwork'

defineProps<{ status: ArtworkStatus }>()

const tone = { available: 'blue', sold: 'ink', archived: 'outline' } as const
</script>

<template>
  <UiLabel :tone="tone[status]">{{ statusLabel[status] }}</UiLabel>
</template>

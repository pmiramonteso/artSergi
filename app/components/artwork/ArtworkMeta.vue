<script setup lang="ts">
import type { Artwork } from '#shared/types/artwork'
import { formatDimensions } from '#shared/utils/artwork'

/** Year · medium · dimensions, with a localized "to be confirmed" for missing data. */
defineProps<{ artwork: Artwork }>()
const { locale } = useI18n()
</script>

<template>
  <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
    <dt class="text-eyebrow opacity-70">{{ $t('works.year') }}</dt>
    <dd>{{ artwork.year ?? $t('works.pending') }}</dd>
    <dt class="text-eyebrow opacity-70">{{ $t('works.medium') }}</dt>
    <dd>{{ artwork.medium ?? $t('works.pending') }}</dd>
    <dt class="text-eyebrow opacity-70">{{ $t('works.size') }}</dt>
    <dd>{{ formatDimensions(artwork.dimensions, locale) ?? $t('works.pending') }}</dd>
  </dl>
</template>

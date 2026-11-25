<script setup lang="ts">
import type { Artwork } from '#shared/types/artwork'
import { artworkTitle } from '#shared/utils/artwork'

/** Framed artwork image, or a labeled placeholder until the photo exists. */
const props = withDefaults(
  defineProps<{ artwork: Artwork; index: number; eager?: boolean; sizes?: string }>(),
  { eager: false, sizes: undefined },
)

const placeholder = computed(
  () => `${artworkTitle(props.artwork)} · painting ${props.index + 1}: photo pending`,
)
</script>

<template>
  <div class="bg-paper p-[3.5%] shadow-paper">
    <img
      v-if="artwork.image"
      :src="artwork.image.src"
      :width="artwork.image.width"
      :height="artwork.image.height"
      :alt="artwork.image.alt"
      :sizes="sizes"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="block h-auto w-full"
    />
    <UiPlaceholder v-else :label="placeholder" ratio="4 / 5" />
  </div>
</template>

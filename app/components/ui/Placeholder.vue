<script setup lang="ts">
/**
 * Clearly marked stand-in for an asset that has not been supplied yet.
 * It must never look like real artwork: it is hatched and labeled.
 * Replace with the real image once Sergi provides it (see ASSET_GUIDELINES.md).
 */
withDefaults(
  defineProps<{
    /** What will go here, e.g. "Artwork photo — painting 001". */
    label: string
    /** CSS aspect-ratio, e.g. "4 / 5". Reserves space to avoid layout shift. */
    ratio?: string
    /** Small slots: label only, no badge (still hatched and dashed). */
    compact?: boolean
  }>(),
  { ratio: '4 / 5', compact: false },
)
</script>

<template>
  <figure
    class="relative flex w-full items-center justify-center overflow-hidden border border-dashed border-ink/40 bg-paper bg-[repeating-linear-gradient(135deg,transparent_0_10px,rgb(37_37_31/0.05)_10px_11px)]"
    :style="{ aspectRatio: ratio }"
    role="img"
    :aria-label="`Placeholder: ${label}`"
  >
    <figcaption
      class="flex flex-col items-center text-center"
      :class="compact ? 'gap-1 p-1' : 'gap-2 p-4'"
    >
      <span v-if="!compact" class="bg-ink px-2 py-1 text-eyebrow text-paper">Placeholder</span>
      <span :class="compact ? 'text-[0.6rem] leading-tight' : 'text-sm'">{{ label }}</span>
    </figcaption>
  </figure>
</template>

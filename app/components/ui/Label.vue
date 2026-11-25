<script setup lang="ts">
/** Small editorial label, e.g. "Nº 001", "Sold", "Collection". */
withDefaults(
  defineProps<{
    tone?: 'outline' | 'ink' | 'blue' | 'tomato' | 'butter'
    as?: string
  }>(),
  { tone: 'outline', as: 'span' },
)

const toneClass = {
  outline: 'border border-current text-ink',
  ink: 'bg-ink text-paper',
  blue: 'bg-electric-blue text-paper',
  tomato: 'bg-tomato text-ink',
  butter: 'bg-butter text-ink',
} as const
</script>

<template>
  <component
    :is="as"
    class="inline-flex items-center gap-1.5 px-2 py-1 text-eyebrow"
    :class="toneClass[tone]"
  >
    <slot />
  </component>
</template>

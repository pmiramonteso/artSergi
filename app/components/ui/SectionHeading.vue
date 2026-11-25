<script setup lang="ts">
/**
 * Section heading: optional number + eyebrow, a title (serif or sans) and an
 * optional lead paragraph (default slot). `level` keeps heading hierarchy correct.
 */
withDefaults(
  defineProps<{
    title: string
    eyebrow?: string
    number?: string
    level?: 1 | 2 | 3
    font?: 'serif' | 'sans'
  }>(),
  { eyebrow: undefined, number: undefined, level: 2, font: 'serif' },
)
</script>

<template>
  <header class="flex max-w-(--container-prose) flex-col gap-4">
    <p v-if="eyebrow || number" class="flex items-center gap-3 text-eyebrow">
      <span v-if="number" class="text-electric-blue">{{ number }}</span>
      <span v-if="number && eyebrow" aria-hidden="true" class="h-px w-8 bg-ink" />
      <span v-if="eyebrow">{{ eyebrow }}</span>
    </p>
    <component
      :is="`h${level}`"
      :class="[
        font === 'serif' ? 'font-serif font-normal' : 'font-sans font-semibold tracking-tight',
        level === 1 ? 'text-h1' : level === 2 ? 'text-h2' : 'text-h3',
      ]"
    >
      {{ title }}
    </component>
    <div v-if="$slots.default" class="text-lead">
      <slot />
    </div>
  </header>
</template>

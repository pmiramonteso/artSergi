<script setup lang="ts">
/**
 * Language switcher: real links to the same page in each language (crawlable,
 * works without JS), with `lang`/`hreflang` so assistive tech and search
 * engines know the target language.
 */
defineProps<{ variant?: 'chip' | 'menu' }>()

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <nav :aria-label="$t('nav.language')">
    <ul class="flex items-center" :class="variant === 'menu' ? 'gap-4' : 'gap-0.5'">
      <li v-for="l in locales" :key="l.code">
        <NuxtLink
          :to="switchLocalePath(l.code)"
          :lang="l.language"
          :hreflang="l.language"
          :aria-current="l.code === locale ? 'true' : undefined"
          :title="l.name"
          class="block px-2 py-1.5 text-eyebrow transition-colors duration-(--duration-fast)"
          :class="l.code === locale ? 'bg-ink text-paper' : 'hover:bg-ink/10'"
        >
          {{ l.code }}
          <span class="sr-only">({{ l.name }})</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

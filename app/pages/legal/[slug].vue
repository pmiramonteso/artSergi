<script setup lang="ts">
import { legalPages, type LegalSlug } from '~/data/site'

/**
 * Legal pages: reserved routes so footer links never 404. The actual legal
 * texts must be written/approved by the business (not generated). Noindex
 * until real content exists.
 */
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()

const slug = String(route.params.slug)
if (!(legalPages as readonly string[]).includes(slug)) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}
const label = computed(() => t(`legal.pages.${slug as LegalSlug}`))

useSeoMeta({
  title: label,
  description: () => `${label.value}, ${t('site.name')}.`,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <UiContainer class="flex min-h-[70svh] flex-col justify-center gap-6 py-32">
    <UiSectionHeading :level="1" :eyebrow="$t('legal.eyebrow')" :title="label">
      {{ $t('legal.preparing') }}
    </UiSectionHeading>
    <UiButton :to="localePath('/')" variant="ghost" class="self-start">
      {{ $t('legal.back') }}
    </UiButton>
  </UiContainer>
</template>

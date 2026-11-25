<script setup lang="ts">
import { legalPages } from '~/data/site'

/**
 * Legal pages: reserved routes so footer links never 404. The actual legal
 * texts must be written/approved by the business (not generated). Noindex
 * until real content exists.
 */
const route = useRoute()
const page = legalPages.find((p) => p.slug === route.params.slug)
if (!page) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.label,
  description: `${page.label}, Sergi Tugas Art Studio.`,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <UiContainer v-if="page" class="flex min-h-[70svh] flex-col justify-center gap-6 py-32">
    <UiSectionHeading :level="1" eyebrow="Legal" :title="page.label">
      This page is being prepared and will be published before anything is sold on this site.
    </UiSectionHeading>
    <UiButton to="/" variant="ghost" class="self-start">← Back to the homepage</UiButton>
  </UiContainer>
</template>

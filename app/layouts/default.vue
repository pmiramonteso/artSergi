<script setup lang="ts">
/**
 * Default layout. Sets per-locale <html lang>, canonical, hreflang
 * alternates (incl. x-default) and og:locale via useLocaleHead.
 */
const i18nHead = useLocaleHead({ dir: true, lang: true, seo: true })
const { t } = useI18n()

useHead(() => ({
  htmlAttrs: { lang: i18nHead.value.htmlAttrs?.lang, dir: i18nHead.value.htmlAttrs?.dir },
  link: [...(i18nHead.value.link ?? [])],
  meta: [...(i18nHead.value.meta ?? [])],
}))

useSeoMeta({
  ogSiteName: () => t('site.name'),
  ogType: 'website',
  twitterCard: 'summary',
})
</script>

<template>
  <div class="flex min-h-svh flex-col bg-paper-grain">
    <a
      href="#main"
      class="fixed top-3 left-3 z-50 -translate-y-20 bg-ink px-3 py-2 text-eyebrow text-paper focus:translate-y-0"
    >
      {{ $t('site.skipToContent') }}
    </a>
    <CommerceTestBanner />
    <LayoutHeader />
    <main id="main" tabindex="-1" class="flex-1 focus:outline-none">
      <slot />
    </main>
    <LayoutFooter />
  </div>
</template>

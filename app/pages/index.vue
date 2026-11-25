<script setup lang="ts">
import { useRevealOnScroll } from '~/composables/useRevealOnScroll'
import { socialLinks } from '~/data/site'
import { personJsonLd, websiteJsonLd } from '#shared/utils/structured-data'

const { t, locale } = useI18n()
const requestUrl = useRequestURL()
const { public: config } = useRuntimeConfig()

useSeoMeta({
  title: () => t('meta.home.title'),
  ogTitle: () => `${t('meta.home.title')} · ${t('site.artist')}`,
  description: () => t('meta.home.description'),
  ogDescription: () => t('meta.home.description'),
})

const origin = config.siteUrl || requestUrl.origin
const pageUrl = computed(() => new URL(`/${locale.value}`, origin).toString())
useHead({
  script: computed(() => [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(
        websiteJsonLd({ url: pageUrl.value, name: t('site.name'), inLanguage: locale.value }),
      ),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(
        personJsonLd({ url: pageUrl.value, sameAs: socialLinks.map((s) => s.href) }),
      ),
    },
  ]),
})

const page = ref<HTMLElement | null>(null)
useRevealOnScroll(page)
</script>

<template>
  <div ref="page" class="relative isolate">
    <LivingCanvas />
    <HeroSection />
    <HomeIntro />
    <HomeSelectedWorks />
    <HomeArtMail />
    <HomeCollection />
    <HomeProcess />
    <HomeAnnual />
    <HomeNewsletter />
  </div>
</template>

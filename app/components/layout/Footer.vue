<script setup lang="ts">
import { mainNavigation } from '~/data/navigation'
import { legalPages, siteContact, socialLinks } from '~/data/site'

const localePath = useLocalePath()
const year = new Date().getFullYear()
const shopSoon = ['originals', 'prints', 'gifts'] as const
</script>

<template>
  <footer class="relative z-10 border-t border-ink/15 bg-paper">
    <UiContainer class="grid gap-12 py-16 md:grid-cols-12">
      <div class="flex flex-col gap-4 md:col-span-4">
        <p class="font-serif text-h2 italic">{{ $t('site.artist') }}</p>
        <p class="max-w-xs text-sm opacity-80">{{ $t('footer.tagline') }}</p>
      </div>

      <nav
        :aria-label="$t('footer.label')"
        class="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-8"
      >
        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">{{ $t('footer.explore') }}</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-for="item in mainNavigation" :key="item.hash">
              <NuxtLink
                :to="{ path: localePath('/'), hash: `#${item.hash}` }"
                class="hover:underline"
              >
                {{ $t(item.key) }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">{{ $t('footer.shop') }}</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-for="s in shopSoon" :key="s" class="flex flex-wrap items-center gap-2">
              <span class="opacity-80">{{ $t(`footer.shopItems.${s}`) }}</span>
              <span class="text-[0.65rem] tracking-widest uppercase">
                {{ $t('footer.soon') }}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">{{ $t('footer.contact') }}</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-if="siteContact.email">
              <a :href="`mailto:${siteContact.email}`" class="hover:underline">
                {{ siteContact.email }}
              </a>
            </li>
            <li v-else class="opacity-80">{{ $t('footer.contactSoon') }}</li>
            <li v-for="s in socialLinks" :key="s.href">
              <a :href="s.href" rel="noopener me" target="_blank" class="hover:underline">
                {{ s.label }}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">{{ $t('footer.legal') }}</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-for="slug in legalPages" :key="slug">
              <NuxtLink :to="localePath(`/legal/${slug}`)" class="hover:underline">
                {{ $t(`legal.pages.${slug}`) }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </UiContainer>
    <UiContainer
      class="flex flex-wrap justify-between gap-4 border-t border-ink/15 py-6 text-sm opacity-80"
    >
      <p>{{ $t('footer.copyright', { year }) }}</p>
      <p>{{ $t('site.previewNotice') }}</p>
    </UiContainer>
  </footer>
</template>

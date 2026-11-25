<script setup lang="ts">
import { PRICING_PUBLISHED, artMailOffers, formatPrice } from '#shared/constants/products'
import type { LocaleCode } from '#shared/constants/i18n'

/**
 * 04 · Current collection: PLACES WE KEEP Nº 001. Prices come from the
 * central offer config and stay hidden until PRICING_PUBLISHED is true.
 * No checkout yet: the CTA asks to be notified.
 */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed(() => locale.value as LocaleCode)
const single = artMailOffers.find((o) => o.id === 'art-mail-single')
const { data: c } = await useCollection('places-we-keep')
</script>

<template>
  <section
    id="collection"
    data-canvas-scene="collection"
    aria-labelledby="collection-title"
    class="min-h-svh scroll-mt-16 py-(--spacing-section)"
  >
    <UiContainer v-if="c" class="grid gap-16 md:grid-cols-12 md:gap-8">
      <div class="flex flex-col gap-8 md:col-span-7">
        <div data-reveal class="flex flex-col gap-4">
          <p class="flex items-center gap-3 text-eyebrow">
            <span class="text-electric-blue">04</span>
            <span aria-hidden="true" class="h-px w-8 bg-ink" />
            <span>{{ $t('collection.eyebrow') }}</span>
          </p>
          <UiLabel tone="tomato" class="self-start">{{ c.number }}</UiLabel>
          <h2 id="collection-title" class="font-serif text-display">{{ c.title }}</h2>
          <p class="font-serif text-h3 italic">{{ c.tagline[lang] }}</p>
        </div>
        <p data-reveal class="max-w-(--container-prose) text-lead">{{ c.description[lang] }}</p>

        <figure data-reveal class="max-w-xl rotate-1 bg-paper p-3 shadow-float">
          <UiPlaceholder :label="$t('collection.illustration', { title: c.title })" ratio="3 / 2" />
        </figure>
      </div>

      <aside
        data-reveal
        class="flex flex-col gap-8 self-start bg-paper p-6 shadow-paper md:sticky md:top-24 md:col-span-5 md:p-8"
        :aria-label="$t('collection.inside')"
      >
        <div>
          <h3 class="mb-4 text-eyebrow">{{ $t('collection.eachEnvelope') }}</h3>
          <ol class="flex flex-col divide-y divide-ink/15">
            <li v-for="(item, i) in c.contents" :key="item.name" class="flex gap-4 py-3">
              <span class="text-eyebrow text-electric-blue">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <span>
                <span class="block font-medium">{{ item.name }}</span>
                <span class="block text-sm opacity-80">{{ item.detail[lang] }}</span>
              </span>
            </li>
          </ol>
        </div>

        <dl class="grid grid-cols-2 gap-4 border-t border-ink/15 pt-6">
          <div>
            <dt class="text-eyebrow opacity-70">{{ $t('collection.edition') }}</dt>
            <dd class="font-serif text-h3">{{ $t('collection.pilotOf', { n: c.editionSize }) }}</dd>
          </div>
          <div>
            <dt class="text-eyebrow opacity-70">{{ $t('collection.price') }}</dt>
            <dd v-if="PRICING_PUBLISHED && single" class="font-serif text-h3">
              {{ formatPrice(single.amount, single.currency, lang) }}
              <span class="block text-sm">{{ $t('collection.plusShipping') }}</span>
            </dd>
            <dd v-else class="text-sm">{{ $t('collection.priceLater') }}</dd>
          </div>
        </dl>

        <div class="flex flex-col gap-2">
          <UiButton :to="{ path: localePath('/'), hash: '#newsletter' }" size="lg">
            {{ $t('collection.notify') }}
          </UiButton>
          <p class="text-sm opacity-80">{{ $t('collection.notOnSale') }}</p>
        </div>
      </aside>
    </UiContainer>
  </section>
</template>

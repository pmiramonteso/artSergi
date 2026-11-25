<script setup lang="ts">
import type { PublicOffer } from '#shared/schemas/checkout'
import { formatPrice } from '#shared/constants/products'

/**
 * Purchasable Art Mail offers (only when commerce is enabled). Sends WHAT to
 * buy to the server, which decides the price and opens Stripe Checkout.
 * Each attempt uses a fresh idempotency key; double clicks reuse it.
 */
const { t, locale } = useI18n()
const { data } = await useFetch('/api/commerce/offers', {
  query: { locale },
  key: computed(() => `offers:${locale.value}`),
  default: () => ({ mode: 'off', data: [] as PublicOffer[] }),
})

const busy = ref<string | null>(null)
const error = ref('')
let attemptKey: string | null = null

async function buy(offer: PublicOffer) {
  if (busy.value) return
  busy.value = offer.sku
  error.value = ''
  attemptKey ??= crypto.randomUUID()
  try {
    const { url } = await $fetch<{ url: string }>('/api/checkout', {
      method: 'POST',
      headers: { 'Idempotency-Key': attemptKey },
      body: { sku: offer.sku, quantity: 1, locale: locale.value },
    })
    window.location.assign(url)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: { data?: { code?: string } } }
    error.value =
      e.data?.data?.code === 'SOLD_OUT'
        ? t('commerce.errors.soldOut')
        : e.statusCode === 503
          ? t('commerce.errors.unavailable')
          : t('commerce.errors.generic')
    attemptKey = null
    busy.value = null
  }
}

const suffix = (o: PublicOffer) =>
  o.interval === 'month'
    ? t('commerce.perMonth')
    : o.interval === 'year'
      ? t('commerce.perYear')
      : ''
</script>

<template>
  <div v-if="data.data.length" class="flex flex-col gap-4">
    <p v-if="data.mode === 'test'" class="text-eyebrow text-tomato-ink">
      {{ $t('commerce.provisional') }}
    </p>
    <ul class="flex flex-col divide-y divide-ink/15">
      <li
        v-for="o in data.data"
        :key="o.sku"
        class="flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <span>
          <span class="block font-medium">{{ o.title }}</span>
          <span class="text-sm">
            {{ formatPrice(o.amount, o.currency as 'EUR', locale) }} {{ suffix(o) }}
            <template v-if="o.available !== null">
              ·
              {{
                o.available > 0 ? $t('commerce.left', { n: o.available }) : $t('commerce.soldOut')
              }}
            </template>
          </span>
        </span>
        <UiButton
          :disabled="!!busy || o.available === 0"
          :aria-busy="busy === o.sku ? 'true' : undefined"
          @click="buy(o)"
        >
          {{
            busy === o.sku
              ? $t('commerce.redirecting')
              : o.interval
                ? $t('commerce.subscribe')
                : $t('commerce.buy')
          }}
        </UiButton>
      </li>
    </ul>
    <p v-if="error" role="alert" class="text-sm text-tomato-ink">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { CheckoutStatus } from '#shared/schemas/checkout'

/**
 * Landing after Stripe. The redirect itself proves nothing: the status
 * shown comes from the server (webhook or server-side reconciliation).
 */
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
useSeoMeta({ title: () => t('commerce.success.title'), robots: 'noindex, nofollow' })

const sessionId = String(route.query.session_id ?? '')
const status = ref<CheckoutStatus>({ status: 'pending', orderNumber: null })
const attempts = ref(0)
const MAX = 10

async function poll() {
  try {
    status.value = await $fetch<CheckoutStatus>('/api/checkout/status', {
      query: { session_id: sessionId },
    })
  } catch {
    status.value = { status: 'unknown', orderNumber: null }
  }
  if (status.value.status === 'pending' && ++attempts.value < MAX) setTimeout(poll, 2000)
}
onMounted(poll)
</script>

<template>
  <UiContainer class="flex min-h-[70svh] flex-col justify-center gap-6 py-32">
    <UiSectionHeading :level="1" :title="$t('commerce.success.title')" />
    <p role="status" aria-live="polite" class="text-lead">
      <template v-if="status.status === 'paid'">
        {{ $t('commerce.success.confirmed', { number: status.orderNumber }) }}
      </template>
      <template v-else-if="status.status === 'pending'">
        {{ attempts >= MAX ? $t('commerce.success.pendingLong') : $t('commerce.success.pending') }}
      </template>
      <template v-else-if="status.status === 'cancelled'">
        {{ $t('commerce.success.cancelled') }}
      </template>
      <template v-else>{{ $t('commerce.success.unknown') }}</template>
    </p>
    <UiButton :to="localePath('/')" variant="ghost" class="self-start">
      {{ $t('legal.back') }}
    </UiButton>
  </UiContainer>
</template>

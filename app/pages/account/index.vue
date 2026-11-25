<script setup lang="ts">
import { formatPrice } from '#shared/constants/products'

interface Overview {
  user: {
    name: string
    email: string
    emailVerified: boolean
    twoFactorEnabled: boolean
    isAdmin: boolean
  }
  canManageBilling: boolean
  orders: Array<{
    number: string
    status: string
    totalAmount: number
    currency: string
    createdAt: string
  }>
  subscriptions: Array<{
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  }>
}

const { t, locale } = useI18n()
const localePath = useLocalePath()
useSeoMeta({ title: () => t('account.title'), robots: 'noindex, nofollow' })

const { data, error } = await useFetch<Overview>('/api/account/overview', {
  key: 'account-overview',
  headers: useRequestHeaders(['cookie']),
})
if (error.value?.statusCode === 401) {
  await navigateTo(localePath('/account/sign-in'))
}

const dateFmt = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }))
const busy = ref(false)

async function openBilling() {
  busy.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/account/billing-portal', {
      method: 'POST',
      body: { locale: locale.value },
    })
    window.location.assign(url)
  } finally {
    busy.value = false
  }
}

async function signOut() {
  await authClient.signOut()
  await navigateTo(localePath('/'))
}
</script>

<template>
  <UiContainer class="flex flex-col gap-12 pt-32 pb-(--spacing-section)">
    <p v-if="error && error.statusCode !== 401" role="alert" class="text-lead">
      {{ $t('account.unavailable') }}
    </p>

    <template v-if="data">
      <header class="flex flex-wrap items-end justify-between gap-6">
        <UiSectionHeading :level="1" :eyebrow="data.user.email" :title="$t('account.title')" />
        <div class="flex flex-wrap gap-3">
          <UiButton v-if="data.user.isAdmin" href="/admin" variant="secondary">
            {{ $t('account.security.admin') }}
          </UiButton>
          <UiButton :to="localePath('/account/security')" variant="secondary">
            {{ $t('account.security.title') }}
          </UiButton>
          <UiButton variant="ghost" @click="signOut">{{ $t('account.signOut') }}</UiButton>
        </div>
      </header>

      <section aria-labelledby="acc-orders" class="flex flex-col gap-4">
        <h2 id="acc-orders" class="text-h3 font-semibold">{{ $t('account.orders') }}</h2>
        <p v-if="!data.orders.length">{{ $t('account.noOrders') }}</p>
        <ul v-else class="flex flex-col divide-y divide-ink/15 bg-paper shadow-paper">
          <li
            v-for="o in data.orders"
            :key="o.number"
            class="flex flex-wrap justify-between gap-4 p-4"
          >
            <span class="font-medium">{{ o.number }}</span>
            <span>{{ dateFmt.format(new Date(o.createdAt)) }}</span>
            <span>{{ formatPrice(o.totalAmount, o.currency as 'EUR', locale) }}</span>
            <UiLabel>{{ $t(`account.status.${o.status}`) }}</UiLabel>
          </li>
        </ul>
      </section>

      <section aria-labelledby="acc-subs" class="flex flex-col gap-4">
        <h2 id="acc-subs" class="text-h3 font-semibold">{{ $t('account.subscriptions') }}</h2>
        <p v-if="!data.subscriptions.length">{{ $t('account.noSubscriptions') }}</p>
        <ul v-else class="flex flex-col divide-y divide-ink/15 bg-paper shadow-paper">
          <li
            v-for="(s, i) in data.subscriptions"
            :key="i"
            class="flex flex-wrap justify-between gap-4 p-4"
          >
            <UiLabel tone="blue">{{ $t(`account.status.${s.status}`) }}</UiLabel>
            <span v-if="s.currentPeriodEnd">
              {{
                $t(s.cancelAtPeriodEnd ? 'account.ends' : 'account.renews', {
                  date: dateFmt.format(new Date(s.currentPeriodEnd)),
                })
              }}
            </span>
          </li>
        </ul>
        <UiButton
          v-if="data.canManageBilling"
          class="self-start"
          :disabled="busy"
          @click="openBilling"
        >
          {{ $t('account.manageBilling') }}
        </UiButton>
      </section>
    </template>
  </UiContainer>
</template>

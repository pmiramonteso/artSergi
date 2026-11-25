<script setup lang="ts">
import { renderSVG } from 'uqr'

const { t } = useI18n()
const localePath = useLocalePath()
useSeoMeta({ title: () => t('account.security.title'), robots: 'noindex, nofollow' })

const session = authClient.useSession()
const enabled = computed(() => !!session.value.data?.user?.twoFactorEnabled)

const password = ref('')
const code = ref('')
const setup = ref<{ uri: string; secret: string; qr: string; backupCodes: string[] } | null>(null)
const error = ref('')
const busy = ref(false)

async function startEnable() {
  busy.value = true
  error.value = ''
  const { data, error: err } = await authClient.twoFactor.enable({ password: password.value })
  busy.value = false
  if (err || !data || data.method !== 'totp') return (error.value = t(authErrorKey(err)))
  const uri = data.totpURI
  setup.value = {
    uri,
    secret: new URL(uri).searchParams.get('secret') ?? '',
    qr: renderSVG(uri, { border: 1 }),
    backupCodes: data.backupCodes,
  }
}

async function confirmEnable() {
  busy.value = true
  const { error: err } = await authClient.twoFactor.verifyTotp({ code: code.value.trim() })
  busy.value = false
  if (err) return (error.value = t('account.errors.code'))
  setup.value = null
  password.value = ''
  code.value = ''
  await session.value.refetch()
}

async function disable() {
  busy.value = true
  const { error: err } = await authClient.twoFactor.disable({ password: password.value })
  busy.value = false
  if (err) return (error.value = t(authErrorKey(err)))
  password.value = ''
  await session.value.refetch()
}

const deletePassword = ref('')
async function deleteAccount() {
  busy.value = true
  const { error: err } = await authClient.deleteUser({ password: deletePassword.value })
  busy.value = false
  if (err) return (error.value = t(authErrorKey(err)))
  await navigateTo(localePath('/'))
}
</script>

<template>
  <UiContainer class="flex flex-col gap-12 pt-32 pb-(--spacing-section)">
    <UiSectionHeading :level="1" :title="$t('account.security.title')" />
    <p v-if="error" role="alert" class="text-tomato-ink">{{ error }}</p>

    <section
      aria-labelledby="sec-2fa"
      class="flex max-w-xl flex-col gap-6 bg-paper p-6 shadow-paper"
    >
      <h2 id="sec-2fa" class="flex items-center gap-3 text-h3 font-semibold">
        {{ $t('account.security.twoFactor') }}
        <UiLabel :tone="enabled ? 'blue' : 'outline'">
          {{ enabled ? $t('account.security.enabled') : $t('account.security.disabled') }}
        </UiLabel>
      </h2>

      <div v-if="setup" class="flex flex-col gap-4">
        <p>{{ $t('account.security.scan') }}</p>
        <!-- eslint-disable-next-line vue/no-v-html -- SVG generated locally by uqr from our own URI -->
        <div class="w-48 bg-white p-2" aria-hidden="true" v-html="setup.qr" />
        <p class="text-sm">
          {{ $t('account.security.manual') }} <code class="break-all">{{ setup.secret }}</code>
        </p>
        <p class="text-sm">{{ $t('account.security.backup') }}</p>
        <ul class="grid grid-cols-2 gap-1 font-mono text-sm">
          <li v-for="c in setup.backupCodes" :key="c">{{ c }}</li>
        </ul>
        <form class="flex flex-col gap-4" @submit.prevent="confirmEnable">
          <UiInput
            id="sec-code"
            v-model="code"
            :label="$t('account.code')"
            autocomplete="one-time-code"
            required
          />
          <UiButton type="submit" :disabled="busy" class="self-start">{{
            $t('account.verify')
          }}</UiButton>
        </form>
      </div>

      <form
        v-else
        class="flex flex-col gap-4"
        @submit.prevent="enabled ? disable() : startEnable()"
      >
        <UiInput
          id="sec-password"
          v-model="password"
          :label="$t('account.security.confirmPassword')"
          type="password"
          autocomplete="current-password"
          required
        />
        <UiButton type="submit" :disabled="busy" class="self-start">
          {{ enabled ? $t('account.security.disable') : $t('account.security.enable') }}
        </UiButton>
      </form>
    </section>

    <section
      aria-labelledby="sec-delete"
      class="flex max-w-xl flex-col gap-4 border-2 border-tomato p-6"
    >
      <h2 id="sec-delete" class="text-h3 font-semibold">
        {{ $t('account.security.deleteTitle') }}
      </h2>
      <p class="text-sm">{{ $t('account.security.deleteBody') }}</p>
      <form class="flex flex-col gap-4" @submit.prevent="deleteAccount">
        <UiInput
          id="sec-delete-password"
          v-model="deletePassword"
          :label="$t('account.security.confirmPassword')"
          type="password"
          autocomplete="current-password"
          required
        />
        <UiButton type="submit" variant="secondary" :disabled="busy" class="self-start">
          {{ $t('account.security.deleteConfirm') }}
        </UiButton>
      </form>
    </section>
  </UiContainer>
</template>

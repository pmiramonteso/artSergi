<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
useSeoMeta({ title: () => t('account.signIn') })

const email = ref('')
const password = ref('')
const code = ref('')
const step = ref<'password' | 'code'>('password')
const error = ref('')
const busy = ref(false)
const next = () => safeRedirect(route.query.redirect, localePath('/account'))

async function signIn() {
  busy.value = true
  error.value = ''
  const { data, error: err } = await authClient.signIn.email({
    email: email.value,
    password: password.value,
  })
  busy.value = false
  if (err) return (error.value = t(authErrorKey(err)))
  if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
    step.value = 'code'
    return
  }
  await navigateTo(next(), { external: next().startsWith('/admin') })
}

async function verifyCode() {
  busy.value = true
  error.value = ''
  const value = code.value.trim()
  const { error: err } = /^\d{6}$/.test(value)
    ? await authClient.twoFactor.verifyTotp({ code: value })
    : await authClient.twoFactor.verifyBackupCode({ code: value })
  busy.value = false
  if (err)
    return (error.value =
      err.status === 429 ? t('account.errors.tooMany') : t('account.errors.code'))
  await navigateTo(next(), { external: next().startsWith('/admin') })
}
</script>

<template>
  <AccountShell :title="$t('account.signIn')">
    <form v-if="step === 'password'" class="flex flex-col gap-6" @submit.prevent="signIn">
      <UiInput
        id="si-email"
        v-model="email"
        :label="$t('account.email')"
        type="email"
        autocomplete="email"
        inputmode="email"
        required
      />
      <UiInput
        id="si-password"
        v-model="password"
        :label="$t('account.password')"
        type="password"
        autocomplete="current-password"
        required
      />
      <p v-if="error" role="alert" class="text-sm text-tomato-ink">{{ error }}</p>
      <UiButton type="submit" size="lg" :disabled="busy">{{ $t('account.signIn') }}</UiButton>
      <div class="flex flex-col gap-2 text-sm">
        <NuxtLink :to="localePath('/account/forgot-password')" class="underline">{{
          $t('account.forgot')
        }}</NuxtLink>
        <span>
          {{ $t('account.noAccount') }}
          <NuxtLink :to="localePath('/account/sign-up')" class="underline">{{
            $t('account.signUp')
          }}</NuxtLink>
        </span>
      </div>
    </form>

    <form v-else class="flex flex-col gap-6" @submit.prevent="verifyCode">
      <UiInput
        id="si-code"
        v-model="code"
        :label="$t('account.code')"
        :hint="$t('account.codeHint')"
        autocomplete="one-time-code"
        inputmode="text"
        required
      />
      <p v-if="error" role="alert" class="text-sm text-tomato-ink">{{ error }}</p>
      <UiButton type="submit" size="lg" :disabled="busy">{{ $t('account.verify') }}</UiButton>
    </form>
  </AccountShell>
</template>

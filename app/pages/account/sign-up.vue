<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
useSeoMeta({ title: () => t('account.signUp') })

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const done = ref(false)
const busy = ref(false)

async function signUp() {
  busy.value = true
  error.value = ''
  const { error: err } = await authClient.signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
    callbackURL: localePath('/account'),
  })
  busy.value = false
  if (err)
    return (error.value = t(
      err.status === 429 ? 'account.errors.tooMany' : 'account.errors.generic',
    ))
  done.value = true
}
</script>

<template>
  <AccountShell :title="$t('account.signUp')">
    <p v-if="done" role="status" class="text-lead">{{ $t('account.checkEmail') }}</p>
    <form v-else class="flex flex-col gap-6" @submit.prevent="signUp">
      <UiInput
        id="su-name"
        v-model="name"
        :label="$t('account.name')"
        autocomplete="name"
        required
      />
      <UiInput
        id="su-email"
        v-model="email"
        :label="$t('account.email')"
        type="email"
        autocomplete="email"
        inputmode="email"
        required
      />
      <UiInput
        id="su-password"
        v-model="password"
        :label="$t('account.password')"
        type="password"
        autocomplete="new-password"
        :hint="$t('account.passwordHint')"
        :minlength="10"
        required
      />
      <p v-if="error" role="alert" class="text-sm text-tomato-ink">{{ error }}</p>
      <UiButton type="submit" size="lg" :disabled="busy">{{ $t('account.signUp') }}</UiButton>
      <p class="text-sm">
        {{ $t('account.haveAccount') }}
        <NuxtLink :to="localePath('/account/sign-in')" class="underline">{{
          $t('account.signIn')
        }}</NuxtLink>
      </p>
    </form>
  </AccountShell>
</template>

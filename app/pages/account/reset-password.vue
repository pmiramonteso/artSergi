<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
useSeoMeta({ title: () => t('account.resetTitle') })

const token = typeof route.query.token === 'string' ? route.query.token : ''
const invalid = !token || route.query.error === 'INVALID_TOKEN'
const password = ref('')
const state = ref<'form' | 'done' | 'error'>(invalid ? 'error' : 'form')
const busy = ref(false)

async function reset() {
  busy.value = true
  const { error } = await authClient.resetPassword({ newPassword: password.value, token })
  busy.value = false
  state.value = error ? 'error' : 'done'
}
</script>

<template>
  <AccountShell :title="$t('account.resetTitle')">
    <div v-if="state === 'done'" class="flex flex-col gap-6">
      <p role="status" class="text-lead">{{ $t('account.resetDone') }}</p>
      <UiButton :to="localePath('/account/sign-in')">{{ $t('account.signIn') }}</UiButton>
    </div>
    <p v-else-if="state === 'error'" role="alert" class="text-lead">
      {{ $t('account.resetInvalid') }}
    </p>
    <form v-else class="flex flex-col gap-6" @submit.prevent="reset">
      <UiInput
        id="rp-password"
        v-model="password"
        :label="$t('account.newPassword')"
        type="password"
        autocomplete="new-password"
        :hint="$t('account.passwordHint')"
        :minlength="10"
        required
      />
      <UiButton type="submit" size="lg" :disabled="busy">{{ $t('account.save') }}</UiButton>
    </form>
  </AccountShell>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
useSeoMeta({ title: () => t('account.resetTitle') })

const email = ref('')
const sent = ref(false)
const busy = ref(false)

async function send() {
  busy.value = true
  await authClient.requestPasswordReset({
    email: email.value,
    redirectTo: `${window.location.origin}${localePath('/account/reset-password')}`,
  })
  busy.value = false
  // Same message whether or not the account exists (no account enumeration).
  sent.value = true
}
</script>

<template>
  <AccountShell :title="$t('account.resetTitle')">
    <p v-if="sent" role="status" class="text-lead">{{ $t('account.resetSent') }}</p>
    <form v-else class="flex flex-col gap-6" @submit.prevent="send">
      <UiInput
        id="fp-email"
        v-model="email"
        :label="$t('account.email')"
        type="email"
        autocomplete="email"
        inputmode="email"
        required
      />
      <UiButton type="submit" size="lg" :disabled="busy">{{ $t('account.sendReset') }}</UiButton>
    </form>
  </AccountShell>
</template>

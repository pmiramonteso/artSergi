<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
useSeoMeta({ title: () => t('commerce.cancel.title'), robots: 'noindex, nofollow' })
</script>

<template>
  <UiContainer class="flex min-h-[70svh] flex-col justify-center gap-6 py-32">
    <UiSectionHeading :level="1" :title="$t('commerce.cancel.title')">
      {{ $t('commerce.cancel.body') }}
    </UiSectionHeading>
    <UiButton
      :to="{ path: localePath('/'), hash: '#collection' }"
      variant="ghost"
      class="self-start"
    >
      {{ $t('commerce.cancel.back') }}
    </UiButton>
  </UiContainer>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()
const is404 = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: () => (is404.value ? t('error.notFoundTitle') : t('error.genericTitle')),
  robots: 'noindex',
})

const goHome = () => clearError({ redirect: localePath('/') })
</script>

<template>
  <main class="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6">
    <p class="text-sm tracking-[0.2em] uppercase opacity-70">
      {{ $t('error.code', { code: error.statusCode }) }}
    </p>
    <h1 class="text-4xl font-semibold">
      {{ is404 ? $t('error.notFound') : $t('error.generic') }}
    </h1>
    <button type="button" class="self-start underline underline-offset-4" @click="goHome">
      {{ $t('error.home') }}
    </button>
  </main>
</template>

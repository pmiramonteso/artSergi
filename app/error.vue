<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: is404.value ? 'Page not found' : 'Something went wrong',
  robots: 'noindex',
})

const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <main class="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6">
    <p class="text-sm tracking-[0.2em] uppercase opacity-70">Error {{ error.statusCode }}</p>
    <h1 class="text-4xl font-semibold">
      {{ is404 ? 'This page does not exist.' : 'Something went wrong.' }}
    </h1>
    <button type="button" class="self-start underline underline-offset-4" @click="goHome">
      Back to the homepage
    </button>
  </main>
</template>

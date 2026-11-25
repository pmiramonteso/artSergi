<script setup lang="ts">
/** Always-visible notice while commerce runs against Stripe TEST mode. */
const { public: config } = useRuntimeConfig()
</script>

<template>
  <p
    v-if="config.commerceMode === 'test'"
    role="note"
    class="fixed bottom-3 left-1/2 z-50 w-[min(92vw,44rem)] -translate-x-1/2 bg-butter px-4 py-2 text-center text-sm font-medium text-ink shadow-float"
  >
    {{ $t('commerce.testBanner') }}
  </p>
</template>

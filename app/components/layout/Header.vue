<script setup lang="ts">
import { mainNavigation } from '~/data/navigation'

/**
 * Site header: fixed, light-weight, readable over any background (items sit
 * on paper "chips"). Desktop shows the nav inline; mobile opens a native
 * <dialog> (focus trap, Escape to close, background made inert by the browser).
 */
const localePath = useLocalePath()
const dialog = ref<HTMLDialogElement | null>(null)
const menuOpen = ref(false)

function openMenu() {
  dialog.value?.showModal()
  menuOpen.value = true
}
function closeMenu() {
  dialog.value?.close()
}
function onDialogClose() {
  menuOpen.value = false
}

// Close the menu on navigation (e.g. browser back or language change).
const route = useRoute()
watch(() => route.fullPath, closeMenu)

const sectionLink = (hash: string) => ({ path: localePath('/'), hash: `#${hash}` })

// Accounts only make sense once commerce is on (test or live).
const { public: config } = useRuntimeConfig()
const showAccount = config.commerceMode !== 'off'
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-40">
    <div class="page-container flex items-center justify-between gap-4 py-4">
      <NuxtLink :to="localePath('/')" class="pointer-events-auto bg-paper px-3 py-1.5 shadow-paper">
        <img
          src="/illustrations/lettering/hero-lettering.svg"
          :alt="$t('site.artist')"
          width="1532"
          height="729"
          class="block h-8 w-auto"
        />
      </NuxtLink>

      <div class="pointer-events-auto hidden items-center gap-2 md:flex">
        <nav :aria-label="$t('nav.main')">
          <ul class="flex items-center gap-1 bg-paper p-1 shadow-paper">
            <li v-for="item in mainNavigation" :key="item.hash">
              <NuxtLink
                :to="sectionLink(item.hash)"
                class="block px-3 py-1.5 text-sm transition-colors duration-(--duration-fast) hover:bg-ink hover:text-paper"
              >
                {{ $t(item.key) }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <NuxtLink
          v-if="showAccount"
          :to="localePath('/account')"
          class="bg-paper px-3 py-2 text-sm shadow-paper hover:bg-ink hover:text-paper"
        >
          {{ $t('account.nav') }}
        </NuxtLink>
        <LayoutLanguageSwitcher class="bg-paper p-1 shadow-paper" />
      </div>

      <button
        type="button"
        class="pointer-events-auto bg-paper px-3 py-1.5 text-eyebrow shadow-paper md:hidden"
        aria-haspopup="dialog"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        @click="openMenu"
      >
        {{ $t('nav.menu') }}
      </button>
    </div>

    <dialog
      id="mobile-menu"
      ref="dialog"
      :aria-label="$t('nav.mainMenu')"
      class="mobile-menu pointer-events-auto m-0 h-dvh max-h-none w-full max-w-none bg-paper p-0 text-ink"
      @close="onDialogClose"
    >
      <div class="page-container flex h-full flex-col bg-grid py-4">
        <div class="flex items-center justify-between">
          <img
            src="/illustrations/lettering/hero-lettering.svg"
            :alt="$t('site.artist')"
            width="1532"
            height="729"
            class="block h-8 w-auto"
          />
          <button
            type="button"
            class="bg-ink px-3 py-1.5 text-eyebrow text-paper"
            @click="closeMenu"
          >
            {{ $t('nav.close') }}
          </button>
        </div>
        <nav :aria-label="$t('nav.main')" class="mt-12">
          <ul class="flex flex-col gap-2">
            <li v-for="(item, i) in mainNavigation" :key="item.hash">
              <NuxtLink
                :to="sectionLink(item.hash)"
                class="flex items-baseline gap-4 py-2 font-serif text-h2"
                @click="closeMenu"
              >
                <span class="text-eyebrow text-electric-blue">0{{ i + 1 }}</span>
                {{ $t(item.key) }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <NuxtLink
          v-if="showAccount"
          :to="localePath('/account')"
          class="mt-8 text-eyebrow underline"
          @click="closeMenu"
        >
          {{ $t('account.nav') }}
        </NuxtLink>
        <LayoutLanguageSwitcher variant="menu" class="mt-auto pb-4" />
      </div>
    </dialog>
  </header>
</template>

<style scoped>
.mobile-menu::backdrop {
  background: transparent;
}
</style>

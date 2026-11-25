<script setup lang="ts">
import { mainNavigation } from '~/data/navigation'

/**
 * Site header: fixed, light-weight, readable over any background (items sit
 * on paper "chips"). Desktop shows the nav inline; mobile opens a native
 * <dialog> (focus trap, Escape to close, background made inert by the browser).
 */
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

// Close the menu on navigation (e.g. browser back).
const route = useRoute()
watch(() => route.fullPath, closeMenu)
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-40">
    <div class="page-container flex items-center justify-between gap-4 py-4">
      <NuxtLink
        to="/"
        class="pointer-events-auto bg-paper px-3 py-1.5 font-serif text-xl leading-none italic shadow-paper"
      >
        Sergi Tugas
      </NuxtLink>

      <nav aria-label="Main" class="pointer-events-auto hidden md:block">
        <ul class="flex items-center gap-1 bg-paper p-1 shadow-paper">
          <li v-for="item in mainNavigation" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="block px-3 py-1.5 text-sm transition-colors duration-(--duration-fast) hover:bg-ink hover:text-paper"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <button
        type="button"
        class="pointer-events-auto bg-paper px-3 py-1.5 text-eyebrow shadow-paper md:hidden"
        aria-haspopup="dialog"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        @click="openMenu"
      >
        Menu
      </button>
    </div>

    <dialog
      id="mobile-menu"
      ref="dialog"
      aria-label="Main menu"
      class="mobile-menu pointer-events-auto m-0 h-dvh max-h-none w-full max-w-none bg-paper p-0 text-ink"
      @close="onDialogClose"
    >
      <div class="page-container flex h-full flex-col bg-grid py-4">
        <div class="flex items-center justify-between">
          <span class="font-serif text-xl italic">Sergi Tugas</span>
          <button
            type="button"
            class="bg-ink px-3 py-1.5 text-eyebrow text-paper"
            @click="closeMenu"
          >
            Close
          </button>
        </div>
        <nav aria-label="Main" class="mt-12">
          <ul class="flex flex-col gap-2">
            <li v-for="(item, i) in mainNavigation" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-baseline gap-4 py-2 font-serif text-h2"
                @click="closeMenu"
              >
                <span class="text-eyebrow text-electric-blue">0{{ i + 1 }}</span>
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </dialog>
  </header>
</template>

<style scoped>
.mobile-menu::backdrop {
  background: transparent;
}
</style>

<script setup lang="ts">
import { mainNavigation } from '~/data/navigation'
import { legalPages, siteContact, socialLinks } from '~/data/site'

const year = new Date().getFullYear()

const shopSoon = ['Original paintings', 'Art prints', 'Gift subscriptions']
</script>

<template>
  <footer class="relative z-10 border-t border-ink/15 bg-paper">
    <UiContainer class="grid gap-12 py-16 md:grid-cols-12">
      <div class="flex flex-col gap-4 md:col-span-4">
        <p class="font-serif text-h2 italic">Sergi Tugas</p>
        <p class="max-w-xs text-sm opacity-80">
          Independent artist: paintings, collectible art by post, and prints.
        </p>
      </div>

      <nav aria-label="Footer" class="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-8">
        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">Explore</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-for="item in mainNavigation" :key="item.to">
              <NuxtLink :to="item.to" class="hover:underline">{{ item.label }}</NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">Shop</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-for="s in shopSoon" :key="s" class="flex flex-wrap items-center gap-2">
              <span class="opacity-80">{{ s }}</span>
              <span class="text-[0.65rem] tracking-widest uppercase opacity-60">Soon</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">Contact</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-if="siteContact.email">
              <a :href="`mailto:${siteContact.email}`" class="hover:underline">
                {{ siteContact.email }}
              </a>
            </li>
            <li v-else class="opacity-80">Contact details coming soon</li>
            <li v-for="s in socialLinks" :key="s.href">
              <a :href="s.href" rel="noopener me" target="_blank" class="hover:underline">
                {{ s.label }}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-3 text-eyebrow opacity-70">Legal</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-for="l in legalPages" :key="l.slug">
              <NuxtLink :to="`/legal/${l.slug}`" class="hover:underline">{{ l.label }}</NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </UiContainer>
    <UiContainer
      class="flex flex-wrap justify-between gap-4 border-t border-ink/15 py-6 text-sm opacity-80"
    >
      <p>© {{ year }} Sergi Tugas. All artworks © the artist.</p>
      <p>Preview site: content in progress.</p>
    </UiContainer>
  </footer>
</template>

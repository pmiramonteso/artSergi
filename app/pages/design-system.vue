<script setup lang="ts">
import { accessibleTextPairs, palette, type PaletteColor } from '#shared/design/tokens'
import { contrastRatio } from '#shared/utils/contrast'

/** Internal reference page for the design system. Never indexed. */
useSeoMeta({
  title: 'Design system',
  description: 'Internal reference of the Sergi Tugas Art Studio design system.',
  robots: 'noindex, nofollow',
})

const swatches: Array<{ name: PaletteColor; role: string; dark: boolean }> = [
  { name: 'paper', role: 'Main background', dark: false },
  { name: 'ink', role: 'Text, lines', dark: true },
  { name: 'electric-blue', role: 'Accent, links, focus', dark: true },
  { name: 'tomato', role: 'Color blocks (not text on paper)', dark: false },
  { name: 'butter', role: 'Color blocks, highlight', dark: false },
  { name: 'tomato-ink', role: 'Tomato for text on paper', dark: true },
  { name: 'butter-ink', role: 'Butter for text on paper', dark: true },
]

const pairs = accessibleTextPairs.map(([text, bg]) => ({
  text,
  bg,
  ratio: contrastRatio(palette[text], palette[bg]).toFixed(2),
}))

const typeScale = [
  { token: 'text-display', sample: 'Places we keep', cls: 'text-display font-serif' },
  { token: 'text-h1', sample: 'Small places, big feelings', cls: 'text-h1 font-serif' },
  { token: 'text-h2', sample: 'Selected works', cls: 'text-h2 font-serif' },
  { token: 'text-h3', sample: 'Art Mail Club', cls: 'text-h3 font-sans font-semibold' },
  { token: 'text-lead', sample: 'Lead paragraph in Space Grotesk.', cls: 'text-lead' },
  {
    token: 'text-body',
    sample: 'Body text: Space Grotesk. Català: col·lecció, ç, à. Español: ñ, ¿?',
    cls: 'text-body',
  },
  { token: 'text-eyebrow', sample: 'Collection · Nº 001', cls: 'text-eyebrow' },
]
</script>

<template>
  <UiContainer class="flex flex-col gap-(--spacing-section) py-16">
    <UiSectionHeading
      :level="1"
      number="Phase 2"
      eyebrow="Internal reference"
      title="Design system"
    >
      Tokens, type, grid and base components. This page is not indexed and will be removed from
      navigation before launch.
    </UiSectionHeading>

    <!-- Palette -->
    <section aria-labelledby="ds-palette" class="flex flex-col gap-8">
      <h2 id="ds-palette" class="text-h3 font-semibold">Palette</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <li v-for="s in swatches" :key="s.name" class="flex flex-col gap-2">
          <div
            class="flex aspect-square items-end p-3 shadow-paper"
            :style="{ backgroundColor: `var(--color-${s.name})` }"
            :class="s.dark ? 'text-paper' : 'text-ink'"
          >
            <span class="text-eyebrow">{{ palette[s.name] }}</span>
          </div>
          <p class="text-sm font-medium">{{ s.name }}</p>
          <p class="text-sm opacity-75">{{ s.role }}</p>
        </li>
      </ul>

      <h3 class="text-eyebrow">Approved text pairs (WCAG AA ≥ 4.5)</h3>
      <ul class="flex flex-wrap gap-3">
        <li
          v-for="p in pairs"
          :key="`${p.text}-${p.bg}`"
          class="border border-ink/15 px-4 py-3 text-sm"
          :style="{ color: `var(--color-${p.text})`, backgroundColor: `var(--color-${p.bg})` }"
        >
          {{ p.text }} / {{ p.bg }} · {{ p.ratio }}
        </li>
      </ul>
    </section>

    <!-- Typography -->
    <section aria-labelledby="ds-type" class="flex flex-col gap-8">
      <h2 id="ds-type" class="text-h3 font-semibold">Typography</h2>
      <p class="max-w-(--container-prose)">
        Space Grotesk (sans) for interface and body text, Instrument Serif for editorial headings.
        The artist name will use Sergi's own handwritten lettering (SVG), never a script font.
      </p>
      <dl class="flex flex-col gap-6">
        <div
          v-for="t in typeScale"
          :key="t.token"
          class="grid gap-2 border-t border-ink/15 pt-4 md:grid-cols-[10rem_1fr]"
        >
          <dt class="text-eyebrow opacity-70">{{ t.token }}</dt>
          <dd :class="t.cls">{{ t.sample }}</dd>
        </div>
      </dl>
    </section>

    <!-- Grid & surfaces -->
    <section aria-labelledby="ds-grid" class="flex flex-col gap-8">
      <h2 id="ds-grid" class="text-h3 font-semibold">Grid, color fields &amp; surfaces</h2>
      <div class="relative h-80 overflow-hidden border border-ink/15 bg-grid">
        <div class="absolute top-10 left-[8%] h-32 w-40 -rotate-3 bg-electric-blue" />
        <div class="absolute right-[12%] bottom-8 size-36 rounded-full bg-tomato" />
        <div class="absolute top-1/3 left-1/2 h-20 w-56 rotate-2 bg-butter" />
        <DecorStar class="absolute top-6 right-1/3 text-ink" :size="28" />
        <DecorDots class="absolute bottom-6 left-1/4 text-electric-blue" />
        <DecorSquiggle class="absolute top-1/2 left-[6%] text-tomato-ink" />
        <UiLabel tone="ink" class="absolute right-4 bottom-4">Grid · 2.5rem</UiLabel>
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="bg-paper p-6 shadow-paper">
          <p class="mb-2 text-eyebrow">shadow-paper</p>
          <p class="text-sm">Resting paper element: postcards, labels.</p>
        </div>
        <div class="bg-paper p-6 shadow-float">
          <p class="mb-2 text-eyebrow">shadow-float</p>
          <p class="text-sm">Floating artwork in the hero.</p>
        </div>
      </div>
    </section>

    <!-- Components -->
    <section aria-labelledby="ds-components" class="flex flex-col gap-8">
      <h2 id="ds-components" class="text-h3 font-semibold">Components</h2>

      <div class="flex flex-wrap items-center gap-4">
        <UiButton>Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="ghost">Ghost link style</UiButton>
        <UiButton size="lg">Large</UiButton>
        <UiButton disabled>Disabled</UiButton>
        <UiButton to="/">Internal link</UiButton>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <UiLabel>Nº 001</UiLabel>
        <UiLabel tone="ink">Sold</UiLabel>
        <UiLabel tone="blue">Available</UiLabel>
        <UiLabel tone="tomato">Limited edition</UiLabel>
        <UiLabel tone="butter">Art Mail Club</UiLabel>
      </div>

      <div class="flex flex-wrap items-center gap-8 text-ink">
        <DecorStar />
        <DecorStar class="text-tomato" :size="40" />
        <DecorDots class="text-electric-blue" />
        <DecorSquiggle class="text-butter-ink" />
        <DecorArrow />
      </div>

      <div class="grid max-w-3xl gap-6 sm:grid-cols-3">
        <UiPlaceholder label="Artwork photo — painting 001" />
        <UiPlaceholder label="A6 postcard front" ratio="148 / 105" />
        <UiPlaceholder label="Studio photo" ratio="1 / 1" />
      </div>
    </section>
  </UiContainer>
</template>

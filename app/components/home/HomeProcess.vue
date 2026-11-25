<script setup lang="ts">
/**
 * 05 · Studio process. Real studio photographs from Sergi replace the
 * placeholders; the steps listed follow the brief.
 */
const steps = [
  { label: 'Painting', ratio: '4 / 5', cls: 'md:col-span-4' },
  { label: 'Brushes & acrylic textures', ratio: '1 / 1', cls: 'md:col-span-3 md:mt-24' },
  { label: 'Sketches', ratio: '3 / 4', cls: 'md:col-span-4 md:col-start-9 md:-mt-8' },
  { label: 'Work in progress', ratio: '4 / 3', cls: 'md:col-span-5 md:col-start-2' },
  { label: 'Printing', ratio: '1 / 1', cls: 'md:col-span-3 md:mt-16' },
  { label: 'Packing envelopes', ratio: '4 / 5', cls: 'md:col-span-3' },
]
</script>

<template>
  <section
    id="process"
    data-canvas-scene="process"
    aria-labelledby="process-title"
    class="min-h-svh scroll-mt-16 py-(--spacing-section)"
  >
    <UiContainer class="flex flex-col gap-16">
      <div data-reveal>
        <UiSectionHeading number="05" eyebrow="Studio" title="From the studio">
          How a piece takes shape, from the first sketch to the envelope.
        </UiSectionHeading>
      </div>
      <ul class="grid grid-cols-2 gap-6 md:grid-cols-12 md:gap-8" role="list">
        <li v-for="(s, i) in steps" :key="s.label" data-reveal :class="s.cls">
          <figure class="flex flex-col gap-2">
            <UiPlaceholder :label="`Studio photo: ${s.label.toLowerCase()}`" :ratio="s.ratio" />
            <figcaption class="flex gap-2 text-sm">
              <span class="text-electric-blue">{{ String(i + 1).padStart(2, '0') }}</span>
              {{ s.label }}
            </figcaption>
          </figure>
        </li>
      </ul>
    </UiContainer>
  </section>
</template>

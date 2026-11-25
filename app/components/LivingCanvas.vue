<script setup lang="ts">
/**
 * LivingCanvas — the homepage background, fixed behind the content.
 *
 *   L1 Paper    warm surface + grain
 *   L2 Grid     fine modular lines, opacity varies across the screen
 *   L3 Fields   blue / tomato / butter / dot color forms
 *   L4 Details  hand-drawn-style marks (stars, squiggle, dots)
 *   L5 Motion   scroll-driven scene transitions + depth parallax (GSAP)
 *
 * Place it as a sibling of the sections; each section declares its scene
 * with `data-canvas-scene="<name>"` (see app/utils/canvas-scenes.ts).
 * Purely decorative: aria-hidden, no pointer events, and the static
 * composition is fully rendered on the server (works without JS).
 */
import {
  CANVAS_FIELDS,
  getCanvasScene,
  isCanvasSceneName,
  type CanvasField,
  type FieldState,
} from '~/utils/canvas-scenes'
import { MOTION_CONDITIONS, useScrollAnimations } from '~/composables/useScrollAnimations'
import { releaseIntroGate, useIntroGate } from '~/composables/useIntroGate'

const root = ref<HTMLElement | null>(null)

const heroDesktop = getCanvasScene('hero', 'desktop')
const heroMobile = getCanvasScene('hero', 'mobile')

/** CSS variables so the server-rendered composition is correct on every breakpoint. */
function fieldStyle(field: CanvasField) {
  const d = heroDesktop.fields[field]
  const m = heroMobile.fields[field]
  return {
    '--x-d': `${d.x}vw`,
    '--y-d': `${d.y}vh`,
    '--r-d': `${d.rotate}deg`,
    '--s-d': d.scale,
    '--o-d': d.opacity,
    '--x-m': `${m.x}vw`,
    '--y-m': `${m.y}vh`,
    '--r-m': `${m.rotate}deg`,
    '--s-m': m.scale,
    '--o-m': m.opacity,
  }
}

const fieldClass: Record<CanvasField, string> = {
  blue: 'h-[24vmin] w-[34vmin] bg-electric-blue',
  tomato: 'size-[26vmin] rounded-full bg-tomato',
  butter: 'h-[8vmin] w-[30vmin] bg-butter',
  dot: 'size-[6vmin] rounded-full bg-electric-blue',
}

const doodles = [
  { id: 'star-a', is: 'star', x: 44, y: 22, depth: 0.6, cls: 'text-ink', size: 28, mobile: true },
  { id: 'star-b', is: 'star', x: 90, y: 42, depth: 1, cls: 'text-tomato', size: 18, mobile: false },
  {
    id: 'squiggle',
    is: 'squiggle',
    x: 22,
    y: 78,
    depth: 0.4,
    cls: 'text-tomato-ink',
    mobile: false,
  },
  { id: 'dots', is: 'dots', x: 56, y: 86, depth: 0.8, cls: 'text-electric-blue', mobile: true },
] as const

// Hide intro elements until the GSAP intro has set its start state.
useIntroGate()

let introPlayed = false

useScrollAnimations(root, ({ gsap, mm }) => {
  mm.add(MOTION_CONDITIONS, (context) => {
    const el = root.value
    if (!el) return
    const { desktop, reduce } = context.conditions as Record<
      keyof typeof MOTION_CONDITIONS,
      boolean
    >
    const breakpoint = desktop ? 'desktop' : 'mobile'

    const fieldEls = Object.fromEntries(
      CANVAS_FIELDS.map((f) => [f, el.querySelector<HTMLElement>(`[data-field="${f}"]`)]),
    ) as Record<CanvasField, HTMLElement | null>
    const gridLayer = el.querySelector('[data-layer="grid"]')
    const doodleLayer = el.querySelector('[data-layer="doodles"]')

    const moveVars = (s: FieldState) => ({
      x: () => (s.x / 100) * window.innerWidth,
      y: () => (s.y / 100) * window.innerHeight,
      rotation: s.rotate,
      scale: s.scale,
    })
    const fieldVars = (s: FieldState) => ({ ...moveVars(s), autoAlpha: s.opacity })
    /** A field changing sides would travel over the content column in between. */
    const crossesContent = (a: FieldState, b: FieldState) => a.x < 50 !== b.x < 50

    // Sections that drive the canvas (siblings of the canvas, in DOM order).
    const sections = Array.from(
      el.parentElement?.querySelectorAll<HTMLElement>('[data-canvas-scene]') ?? [],
    ).flatMap((section) => {
      const name = section.dataset.canvasScene
      return isCanvasSceneName(name) ? [{ section, name }] : []
    })
    const firstScene = getCanvasScene(sections[0]?.name ?? 'hero', breakpoint)

    // Static starting composition (also the full experience under reduced motion).
    for (const f of CANVAS_FIELDS) {
      if (fieldEls[f]) gsap.set(fieldEls[f], fieldVars(firstScene.fields[f]))
    }
    gsap.set(gridLayer, { autoAlpha: firstScene.grid })
    gsap.set(doodleLayer, { autoAlpha: firstScene.doodles })

    if (!reduce && !introPlayed) {
      introPlayed = true
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      intro
        .from('[data-intro="grid"]', { autoAlpha: 0, duration: 0.4, ease: 'none' }, 0)
        .from(
          '[data-intro="field"]',
          { autoAlpha: 0, scale: 0.6, duration: 0.8, stagger: 0.08, ease: 'back.out(1.6)' },
          0.3,
        )
        .from(
          '[data-intro="doodle"]',
          { autoAlpha: 0, scale: 0.4, duration: 0.6, stagger: 0.08 },
          1,
        )
        .fromTo(
          '[data-intro="doodle"] path[pathLength]',
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' },
          1.1,
        )
    }
    // The `from` tweens above have already applied their start state.
    releaseIntroGate()

    if (reduce) return

    // Progressive scene transitions: one scrubbed timeline per section boundary.
    for (let i = 1; i < sections.length; i++) {
      const from = getCanvasScene(sections[i - 1]!.name, breakpoint)
      const to = getCanvasScene(sections[i]!.name, breakpoint)
      const tl = gsap.timeline({
        defaults: { ease: 'none', immediateRender: false },
        scrollTrigger: {
          trigger: sections[i]!.section,
          start: 'top 85%',
          end: 'top 15%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
      for (const f of CANVAS_FIELDS) {
        const target = fieldEls[f]
        if (!target) continue
        const a = from.fields[f]
        const b = to.fields[f]
        if (crossesContent(a, b)) {
          // Fade out in place, relocate while invisible, fade in at the new spot.
          tl.fromTo(target, { autoAlpha: a.opacity }, { autoAlpha: 0, duration: 0.35 }, 0)
            .fromTo(target, moveVars(a), { ...moveVars(b), duration: 0.3 }, 0.35)
            .to(target, { autoAlpha: b.opacity, duration: 0.35 }, 0.65)
        } else {
          tl.fromTo(target, fieldVars(a), fieldVars(b), 0)
        }
      }
      tl.fromTo(gridLayer, { autoAlpha: from.grid }, { autoAlpha: to.grid }, 0)
      tl.fromTo(doodleLayer, { autoAlpha: from.doodles }, { autoAlpha: to.doodles }, 0)
    }

    // Depth parallax: details drift at different speeds over the whole page.
    const page = el.parentElement
    if (page) {
      el.querySelectorAll<HTMLElement>('[data-depth]').forEach((doodle) => {
        const depth = Number(doodle.dataset.depth) || 0
        gsap.to(doodle, {
          y: () => -depth * window.innerHeight * 0.35,
          ease: 'none',
          scrollTrigger: {
            trigger: page,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
      })
    }
  })
})
</script>

<template>
  <div
    ref="root"
    class="living-canvas pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    aria-hidden="true"
  >
    <!-- L1 · Paper -->
    <div class="absolute inset-0 bg-paper bg-paper-grain" />

    <!-- L2 · Grid -->
    <div data-layer="grid" class="absolute inset-0">
      <div data-intro="grid" class="canvas-grid motion-intro absolute inset-0 bg-grid" />
    </div>

    <!-- L3 · Color fields (outer = scene state, inner = intro) -->
    <div
      v-for="field in CANVAS_FIELDS"
      :key="field"
      :data-field="field"
      class="canvas-field absolute top-0 left-0 will-change-transform"
      :style="fieldStyle(field)"
    >
      <div data-intro="field" class="motion-intro" :class="fieldClass[field]" />
    </div>

    <!-- L4 · Hand-drawn details (outer = parallax, inner = intro) -->
    <div data-layer="doodles" class="absolute inset-0">
      <div
        v-for="d in doodles"
        :key="d.id"
        :data-depth="d.depth"
        class="absolute"
        :class="[d.cls, d.mobile ? '' : 'hidden md:block']"
        :style="{ left: `${d.x}vw`, top: `${d.y}vh` }"
      >
        <div data-intro="doodle" class="motion-intro">
          <DecorStar v-if="d.is === 'star'" :size="'size' in d ? d.size : 24" />
          <DecorSquiggle v-else-if="d.is === 'squiggle'" />
          <DecorDots v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Server-rendered starting composition (GSAP takes over on the client). */
.living-canvas .canvas-field {
  transform: translate(var(--x-m), var(--y-m)) rotate(var(--r-m)) scale(var(--s-m));
  opacity: var(--o-m);
}
@media (min-width: 768px) {
  .living-canvas .canvas-field {
    transform: translate(var(--x-d), var(--y-d)) rotate(var(--r-d)) scale(var(--s-d));
    opacity: var(--o-d);
  }
}

/* Grid opacity varies across the surface: denser centre-left, fading at the edges. */
.living-canvas .canvas-grid {
  mask-image: radial-gradient(ellipse 80% 75% at 40% 45%, #000 35%, rgb(0 0 0 / 0.35) 100%);
}
</style>

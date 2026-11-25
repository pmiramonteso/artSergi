import { MOTION_CONDITIONS, useScrollAnimations } from './useScrollAnimations'

/**
 * Subtle reveal for `[data-reveal]` elements inside `scope` as they enter
 * the viewport (batched, plays once). Content is visible without JS and
 * under reduced motion; elements already scrolled past on load are shown
 * immediately so nothing can stay hidden.
 */
export function useRevealOnScroll(scope: Readonly<Ref<HTMLElement | null>>) {
  useScrollAnimations(scope, ({ gsap, ScrollTrigger, mm }) => {
    mm.add(MOTION_CONDITIONS, (context) => {
      const root = scope.value
      const { reduce } = context.conditions as Record<keyof typeof MOTION_CONDITIONS, boolean>
      if (!root || reduce) return

      const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
      if (!items.length) return
      // Opacity only (not autoAlpha/visibility): content stays in the
      // accessibility tree and reachable by keyboard/screen readers.
      gsap.set(items, { opacity: 0, y: 28 })

      const triggers = ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            overwrite: true,
          }),
      })

      // Anything above the trigger line already (e.g. reload mid-page): show now.
      for (const t of triggers) {
        if (t.scroll() >= t.start) gsap.set(t.trigger!, { opacity: 1, y: 0 })
      }
    })
  })
}

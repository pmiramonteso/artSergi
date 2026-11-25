import { releaseIntroGate } from './useIntroGate'
import { MOTION_CONDITIONS, useScrollAnimations } from './useScrollAnimations'

/**
 * Hero choreography, scoped to the hero root. Expected markup:
 *
 *   [data-hero-art="<scroll depth>"]   scroll transition (outer)
 *     [data-parallax]                  pointer parallax (usePointerParallax)
 *       [data-float]                   idle floating
 *         [data-intro="art"]           intro entrance
 *   [data-hero-lettering]              scroll transition
 *     [data-intro="lettering"]         intro reveal
 *   [data-intro="decor"]               intro for labels/marks
 *   [data-hero-decor]                  fades out on scroll
 *
 * Each concern owns its own wrapper, so tweens never fight over a transform.
 *
 * Timeline (seconds): artworks 0.3–1.1 · lettering 0.7–1.4 ·
 * decorations 1.0–1.6 · floating from 1.6. The page is usable throughout:
 * nothing blocks interaction, and content is never hidden without JS.
 */
export function useHeroAnimation(scope: Readonly<Ref<HTMLElement | null>>) {
  let introPlayed = false

  useScrollAnimations(scope, ({ gsap, mm }) => {
    mm.add(MOTION_CONDITIONS, (context) => {
      const root = scope.value
      if (!root) return
      const { desktop, reduce } = context.conditions as Record<
        keyof typeof MOTION_CONDITIONS,
        boolean
      >

      if (reduce) {
        releaseIntroGate()
        return
      }

      // 1 · Intro (once per page view, not again on breakpoint changes).
      if (!introPlayed) {
        introPlayed = true
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from(
            '[data-intro="art"]',
            {
              autoAlpha: 0,
              y: 60,
              scale: 0.92,
              rotation: (i: number) => (i % 2 ? 8 : -8),
              duration: 0.8,
              stagger: 0.12,
            },
            0.3,
          )
          .fromTo(
            '[data-intro="lettering"]',
            { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut' },
            0.7,
          )
          .from('[data-intro="decor"]', { autoAlpha: 0, y: 12, duration: 0.5, stagger: 0.06 }, 1)
        releaseIntroGate()
      }

      // 2 · Idle floating (desktop/tablet only), paused while the hero is off-screen.
      if (desktop) {
        const floats = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-float]'))
        const tweens = floats.map((el, i) =>
          gsap.to(el, {
            y: i % 2 ? 7 : -7,
            rotation: i % 2 ? -0.6 : 0.6,
            duration: 4 + i * 0.7,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 1.6,
          }),
        )
        gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: ({ isActive }) => tweens.forEach((t) => (isActive ? t.resume() : t.pause())),
          },
        })
      }

      // 3 · Scroll transition: artworks drift down toward Selected Works and
      // straighten; lettering lifts slightly; decorations fade.
      const scroll = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })
      root.querySelectorAll<HTMLElement>('[data-hero-art]').forEach((el) => {
        const depth = Number(el.dataset.heroArt) || 0.5
        scroll.to(
          el,
          {
            y: () => depth * window.innerHeight * (desktop ? 0.45 : 0.25),
            scale: 0.92,
            rotation: 0,
          },
          0,
        )
      })
      scroll
        .to('[data-hero-lettering]', { y: () => -window.innerHeight * 0.08 }, 0)
        .to('[data-hero-decor]', { autoAlpha: 0, duration: 0.5 }, 0)
    })
  })
}

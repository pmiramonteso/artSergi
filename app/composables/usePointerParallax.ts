import { useScrollAnimations } from './useScrollAnimations'

/** Only devices with a real mouse, wide screens, and motion allowed. */
export const POINTER_PARALLAX_QUERY =
  '(hover: hover) and (pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)'

/**
 * Subtle pointer parallax for elements inside `scope` with `data-parallax="<depth>"`
 * (depth 0–1). Each element drifts against the pointer, by `strength × depth`
 * pixels at most. Uses `gsap.quickTo` (no layout reads, one tween per axis),
 * a passive listener, and does nothing while the scope is off-screen.
 * Disabled entirely on touch devices, small screens and reduced motion.
 */
export function usePointerParallax(
  scope: Readonly<Ref<HTMLElement | null>>,
  { strength = 18 }: { strength?: number } = {},
) {
  useScrollAnimations(scope, ({ gsap, mm }) => {
    mm.add(POINTER_PARALLAX_QUERY, () => {
      const root = scope.value
      if (!root) return

      const movers = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]')).map(
        (el) => ({
          depth: Number(el.dataset.parallax) || 0,
          x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
        }),
      )

      let visible = true
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true
      })
      observer.observe(root)

      const onMove = (event: PointerEvent) => {
        if (!visible) return
        const nx = event.clientX / window.innerWidth - 0.5
        const ny = event.clientY / window.innerHeight - 0.5
        for (const m of movers) {
          m.x(-nx * 2 * strength * m.depth)
          m.y(-ny * 2 * strength * m.depth)
        }
      }

      window.addEventListener('pointermove', onMove, { passive: true })
      return () => {
        window.removeEventListener('pointermove', onMove)
        observer.disconnect()
      }
    })
  })
}

import type { GsapTools } from '~/utils/gsap'

type MatchMedia = ReturnType<GsapTools['gsap']['matchMedia']>

export interface ScrollAnimationTools extends GsapTools {
  /**
   * `gsap.matchMedia()` scoped to the component root. Use it for breakpoint
   * and reduced-motion branches: everything created inside `mm.add()` is
   * reverted automatically when the media query stops matching.
   */
  mm: MatchMedia
}

/** Shared media conditions so every animation agrees on breakpoints. */
export const MOTION_CONDITIONS = {
  desktop: '(min-width: 768px)',
  mobile: '(max-width: 767.98px)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const

/**
 * Runs GSAP setup for a component, scoped to `scope` (selector strings only
 * match inside it) and fully reverted on unmount: tweens, ScrollTriggers,
 * inline styles. Safe against unmounting before GSAP finishes loading.
 */
export function useScrollAnimations(
  scope: Readonly<Ref<HTMLElement | null>>,
  setup: (tools: ScrollAnimationTools) => void,
) {
  let ctx: { revert: () => void } | undefined
  let mm: MatchMedia | undefined
  let disposed = false

  onMounted(async () => {
    const tools = await loadGsap()
    if (disposed || !scope.value) return

    const el = scope.value
    mm = tools.gsap.matchMedia(el)
    ctx = tools.gsap.context(() => setup({ ...tools, mm: mm! }), el)
  })

  onBeforeUnmount(() => {
    disposed = true
    mm?.revert()
    ctx?.revert()
  })
}

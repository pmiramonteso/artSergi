import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

export interface GsapTools {
  gsap: typeof import('gsap').gsap
  ScrollTrigger: typeof ScrollTriggerType
}

let toolsPromise: Promise<GsapTools> | null = null

/**
 * Lazily loads GSAP + ScrollTrigger on the client (separate chunk, so it never
 * blocks the first render or LCP) and registers the plugin exactly once.
 * Also refreshes ScrollTrigger once fonts and images have loaded, because they
 * change layout and therefore trigger positions.
 */
export function loadGsap(): Promise<GsapTools> {
  if (import.meta.server) {
    return Promise.reject(new Error('loadGsap() is client-only'))
  }

  toolsPromise ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger)
      // Some sections render conditionally (e.g. no artworks yet): missing targets are fine.
      gsap.config({ nullTargetWarn: false })

      const refresh = () => ScrollTrigger.refresh()
      if (document.readyState === 'complete') queueMicrotask(refresh)
      else window.addEventListener('load', refresh, { once: true })
      document.fonts?.ready.then(refresh).catch(() => {})

      return { gsap, ScrollTrigger }
    },
  )

  return toolsPromise
}

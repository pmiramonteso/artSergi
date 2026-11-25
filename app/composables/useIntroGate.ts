/**
 * Intro gate: prevents the "flash of final state" before GSAP intros run.
 *
 * An inline head script marks <html data-motion-intro="pending"> before the
 * first paint (only when motion is allowed). Elements with the `motion-intro`
 * class are hidden while the flag is set (see main.css). Each animated
 * component calls `releaseIntroGate()` right after its `from()` tweens have
 * applied their start state. A timeout releases the gate if GSAP never loads.
 *
 * Several components may call this; the script is deduplicated by key.
 */
export function useIntroGate() {
  useHead({
    script: [
      {
        key: 'motion-intro-gate',
        innerHTML:
          "(function(){var d=document.documentElement;if(!window.matchMedia||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.dataset.motionIntro='pending';setTimeout(function(){delete d.dataset.motionIntro},3000)})()",
      },
    ],
  })
}

export function releaseIntroGate() {
  if (import.meta.client) delete document.documentElement.dataset.motionIntro
}

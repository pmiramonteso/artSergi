/**
 * Reactive `prefers-reduced-motion: reduce`.
 * `false` during SSR; updates on the client if the user changes the setting.
 *
 * For GSAP code prefer the `reduce` condition of `gsap.matchMedia()` (see
 * useScrollAnimations), which also reverts animations automatically.
 */
export function useReducedMotion() {
  const reduced = ref(false)

  if (import.meta.client) {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => (reduced.value = query.matches)

    onMounted(() => {
      update()
      query.addEventListener('change', update)
    })
    onBeforeUnmount(() => query.removeEventListener('change', update))
  }

  return readonly(reduced)
}

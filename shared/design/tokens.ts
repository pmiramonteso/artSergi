/**
 * Design tokens readable from TypeScript (GSAP, SVG, Three.js, tests).
 *
 * The CSS source of truth is `app/assets/css/main.css` (`@theme`).
 * `tests/unit/design-tokens.test.ts` checks that both stay in sync and
 * that the text/background pairs below meet WCAG 2.2 AA.
 */
export const palette = {
  paper: '#f0ebe0',
  ink: '#25251f',
  'electric-blue': '#3456cf',
  tomato: '#e76c4d',
  butter: '#d8bb68',
  /** Darker variants for text on paper (the base tones fail AA). */
  'tomato-ink': '#a9432a',
  'butter-ink': '#7a611b',
} as const

export type PaletteColor = keyof typeof palette

/**
 * Approved text-on-background pairs (≥ 4.5:1, WCAG AA for body text).
 * Pairs not listed here (e.g. tomato or butter text on paper) are for
 * decoration only: color blocks, strokes, stars, never for text.
 */
export const accessibleTextPairs: ReadonlyArray<[text: PaletteColor, background: PaletteColor]> = [
  ['ink', 'paper'],
  ['ink', 'butter'],
  ['ink', 'tomato'],
  ['electric-blue', 'paper'],
  ['paper', 'electric-blue'],
  ['tomato-ink', 'paper'],
  ['butter-ink', 'paper'],
]

/** Motion tokens (ms / easing) shared by CSS and the GSAP composables. */
export const motion = {
  duration: { fast: 150, base: 300, slow: 600, slower: 1000 },
  ease: {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
} as const

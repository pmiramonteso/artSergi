/**
 * Living Canvas scenes: the state of the background while each homepage
 * section is in view. GSAP interpolates between consecutive scenes as the
 * user scrolls, so the background changes progressively, never abruptly.
 *
 * Coordinates are percentages of the viewport (top-left of each element),
 * so the composition adapts to any screen size.
 */

export const CANVAS_FIELDS = ['blue', 'tomato', 'butter', 'dot'] as const
export type CanvasField = (typeof CANVAS_FIELDS)[number]

export interface FieldState {
  /** Left edge, % of viewport width. */
  x: number
  /** Top edge, % of viewport height. */
  y: number
  scale: number
  /** Degrees. */
  rotate: number
  /** 0–1 */
  opacity: number
}

export interface CanvasScene {
  /** Grid layer opacity, 0–1. */
  grid: number
  /** Hand-drawn details layer opacity, 0–1. */
  doodles: number
  fields: Record<CanvasField, FieldState>
}

export const CANVAS_SCENE_NAMES = [
  'hero',
  'intro',
  'works',
  'art-mail',
  'collection',
  'process',
  'annual',
  'newsletter',
] as const
export type CanvasSceneName = (typeof CANVAS_SCENE_NAMES)[number]

export type CanvasBreakpoint = 'desktop' | 'mobile'

const f = (x: number, y: number, scale = 1, rotate = 0, opacity = 1): FieldState => ({
  x,
  y,
  scale,
  rotate,
  opacity,
})

/**
 * Desktop composition. Content sits mostly in the left/centre column, so
 * outside the hero the color fields stay near the edges.
 */
export const desktopScenes: Record<CanvasSceneName, CanvasScene> = {
  hero: {
    grid: 1,
    doodles: 1,
    fields: {
      blue: f(-4, -4, 1, -6),
      tomato: f(80, 62, 1),
      butter: f(64, 16, 1, 3),
      dot: f(42, 80, 1),
    },
  },
  intro: {
    grid: 0.7,
    doodles: 0.6,
    fields: {
      blue: f(74, 10, 0.7, 4, 0.9),
      tomato: f(86, 70, 0.6, 0, 0.9),
      butter: f(-10, 86, 0.9, -2, 0.8),
      dot: f(92, 42, 0.8),
    },
  },
  works: {
    grid: 0.5,
    doodles: 0.4,
    fields: {
      blue: f(90, -8, 0.5, 12, 0.8),
      tomato: f(-14, 44, 0.9, 0, 0.7),
      butter: f(78, 90, 0.7, -4, 0.9),
      dot: f(4, 10, 0.7),
    },
  },
  'art-mail': {
    grid: 0.8,
    doodles: 1,
    fields: {
      blue: f(70, 54, 1.1, -3, 0.95),
      tomato: f(88, 4, 0.5),
      butter: f(-8, 18, 0.8, 6),
      dot: f(60, 12, 0.9),
    },
  },
  collection: {
    grid: 0.6,
    doodles: 0.7,
    fields: {
      blue: f(-14, 78, 0.6, -10, 0.9),
      tomato: f(72, 28, 1.5, 0, 0.95),
      butter: f(82, 6, 0.6, 2),
      dot: f(64, 84, 1),
    },
  },
  process: {
    grid: 1,
    doodles: 0.8,
    fields: {
      blue: f(88, 10, 0.5, 8),
      tomato: f(-8, 6, 0.5, 0, 0.9),
      butter: f(62, 70, 1.6, -3, 0.9),
      dot: f(90, 50, 0.8),
    },
  },
  annual: {
    grid: 0.5,
    doodles: 0.6,
    fields: {
      blue: f(74, 18, 1.3, 2),
      tomato: f(90, 72, 0.6),
      butter: f(-12, 62, 0.5, -6, 0.8),
      dot: f(66, 76, 0.7),
    },
  },
  newsletter: {
    grid: 0.7,
    doodles: 0.9,
    fields: {
      blue: f(-8, 72, 0.8, -6, 0.9),
      tomato: f(82, 8, 0.8),
      butter: f(72, 80, 0.8, 3),
      dot: f(48, 14, 0.8),
    },
  },
}

/**
 * Mobile is not a scaled-down desktop: fewer elements, smaller fields pushed
 * to the edges, and much lighter fields behind text outside the hero.
 */
export function toMobileScene(scene: CanvasScene, name: CanvasSceneName): CanvasScene {
  const fields = {} as Record<CanvasField, FieldState>
  for (const field of CANVAS_FIELDS) {
    const s = scene.fields[field]
    const hidden = field === 'butter' || field === 'dot'
    fields[field] = {
      // Push to the edges: left half → further left, right half → further right.
      x: s.x < 50 ? Math.min(s.x, 0) - 6 : Math.max(s.x, 70) + 6,
      y: s.y,
      scale: s.scale * 0.75,
      rotate: s.rotate,
      opacity: hidden ? 0 : name === 'hero' ? s.opacity : s.opacity * 0.45,
    }
  }
  return {
    grid: scene.grid * 0.6,
    doodles: name === 'hero' ? scene.doodles * 0.7 : 0,
    fields,
  }
}

export function getCanvasScene(name: CanvasSceneName, breakpoint: CanvasBreakpoint): CanvasScene {
  const scene = desktopScenes[name]
  return breakpoint === 'desktop' ? scene : toMobileScene(scene, name)
}

export function isCanvasSceneName(value: unknown): value is CanvasSceneName {
  return typeof value === 'string' && (CANVAS_SCENE_NAMES as readonly string[]).includes(value)
}

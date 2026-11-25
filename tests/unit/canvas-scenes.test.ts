import { describe, expect, it } from 'vitest'
import { palette } from '../../shared/design/tokens'
import { contrastRatio } from '../../shared/utils/contrast'
import {
  CANVAS_FIELDS,
  CONTENT_FIELD_MAX_OPACITY,
  CANVAS_SCENE_NAMES,
  desktopScenes,
  getCanvasScene,
  isCanvasSceneName,
} from '../../app/utils/canvas-scenes'

describe('canvas scenes', () => {
  it('defines a desktop scene for every scene name', () => {
    expect(Object.keys(desktopScenes).sort()).toEqual([...CANVAS_SCENE_NAMES].sort())
  })

  describe.each(CANVAS_SCENE_NAMES)('scene "%s"', (name) => {
    it.each(['desktop', 'mobile'] as const)('has valid values on %s', (bp) => {
      const scene = getCanvasScene(name, bp)
      expect(scene.grid).toBeGreaterThanOrEqual(0)
      expect(scene.grid).toBeLessThanOrEqual(1)
      expect(scene.doodles).toBeGreaterThanOrEqual(0)
      expect(scene.doodles).toBeLessThanOrEqual(1)
      for (const field of CANVAS_FIELDS) {
        const s = scene.fields[field]
        expect(s.opacity).toBeGreaterThanOrEqual(0)
        expect(s.opacity).toBeLessThanOrEqual(1)
        expect(s.scale).toBeGreaterThan(0)
        // Stay roughly on screen (fields may bleed off the edges, not vanish).
        expect(s.x).toBeGreaterThanOrEqual(-30)
        expect(s.x).toBeLessThanOrEqual(100)
        expect(s.y).toBeGreaterThanOrEqual(-20)
        expect(s.y).toBeLessThanOrEqual(100)
      }
    })
  })

  it('simplifies mobile: fewer visible fields, no details outside the hero', () => {
    for (const name of CANVAS_SCENE_NAMES) {
      const m = getCanvasScene(name, 'mobile')
      expect(m.fields.butter.opacity).toBe(0)
      expect(m.fields.dot.opacity).toBe(0)
      if (name !== 'hero') expect(m.doodles).toBe(0)
    }
  })

  it('keeps mobile fields lighter than desktop behind section content', () => {
    for (const name of CANVAS_SCENE_NAMES.filter((n) => n !== 'hero')) {
      const d = getCanvasScene(name, 'desktop')
      const m = getCanvasScene(name, 'mobile')
      expect(m.fields.blue.opacity).toBeLessThan(d.fields.blue.opacity)
      expect(m.fields.tomato.opacity).toBeLessThan(d.fields.tomato.opacity)
    }
  })

  it('pushes mobile fields to the screen edges', () => {
    for (const name of CANVAS_SCENE_NAMES) {
      for (const field of CANVAS_FIELDS) {
        const x = getCanvasScene(name, 'mobile').fields[field].x
        expect(x <= 0 || x >= 70).toBe(true)
      }
    }
  })

  it('validates scene names', () => {
    expect(isCanvasSceneName('hero')).toBe(true)
    expect(isCanvasSceneName('nope')).toBe(false)
    expect(isCanvasSceneName(undefined)).toBe(false)
  })

  it('keeps ink text readable (AA) over every field behind section content', () => {
    const fieldColor = {
      blue: palette['electric-blue'],
      tomato: palette.tomato,
      butter: palette.butter,
      dot: palette['electric-blue'],
    } as const
    // Browsers composite in sRGB space: blend paper with the field color.
    const blend = (hex: string, alpha: number) => {
      const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
      const out = [0, 1, 2].map((i) =>
        Math.round(ch(palette.paper, i) * (1 - alpha) + ch(hex, i) * alpha),
      )
      return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('')
    }
    for (const name of CANVAS_SCENE_NAMES.filter((n) => n !== 'hero')) {
      for (const bp of ['desktop', 'mobile'] as const) {
        const scene = getCanvasScene(name, bp)
        expect(scene.doodles).toBe(0)
        for (const field of CANVAS_FIELDS) {
          const { opacity } = scene.fields[field]
          expect(opacity).toBeLessThanOrEqual(CONTENT_FIELD_MAX_OPACITY)
          const bg = blend(fieldColor[field], opacity)
          expect(contrastRatio(palette.ink, bg)).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
})

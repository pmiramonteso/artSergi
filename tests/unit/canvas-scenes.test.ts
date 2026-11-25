import { describe, expect, it } from 'vitest'
import {
  CANVAS_FIELDS,
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
})

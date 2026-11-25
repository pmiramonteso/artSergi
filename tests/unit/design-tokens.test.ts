import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { accessibleTextPairs, palette } from '../../shared/design/tokens'
import { contrastRatio } from '../../shared/utils/contrast'

const css = readFileSync(
  fileURLToPath(new URL('../../app/assets/css/main.css', import.meta.url)),
  'utf8',
)

describe('design tokens', () => {
  it.each(Object.entries(palette))('CSS defines --color-%s with the same value', (name, hex) => {
    const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)
    expect(match?.[1]?.toLowerCase()).toBe(hex)
  })

  it.each(accessibleTextPairs)('%s text on %s meets WCAG AA (4.5:1)', (text, background) => {
    expect(contrastRatio(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('contrastRatio', () => {
  it('matches known reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('rejects invalid colors', () => {
    expect(() => contrastRatio('red', '#ffffff')).toThrow()
  })
})

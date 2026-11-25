import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOCALIZED_PAGES } from '../../shared/constants/i18n'

/**
 * Pages with localized slugs must be linked by route NAME (localePath('works')),
 * never by English path (localePath('/works')): the path form produces
 * /es/works, which is a 404 because the Spanish route is /es/obras.
 */
const appDir = fileURLToPath(new URL('../../app', import.meta.url))
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : /\.(vue|ts)$/.test(f) ? [p] : []
  })

describe('localized links', () => {
  const englishSegments = Object.values(LOCALIZED_PAGES).map((p) => p.en.split('/')[1])
  it.each([...new Set(englishSegments)])('no localePath("/%s…") by English path', (segment) => {
    const offenders = files(appDir).filter((f) =>
      new RegExp(String.raw`localePath\(\s*['"` + '`' + String.raw`]/${segment}\b`).test(
        readFileSync(f, 'utf8'),
      ),
    )
    expect(offenders).toEqual([])
  })
})

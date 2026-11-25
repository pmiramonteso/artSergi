/**
 * Builds web derivatives from the preserved source photos.
 *   assets-src/artworks/<slug>/original.*  (never modified)
 *   → public/images/artworks/<slug>/artwork-<name>-<width>.webp
 * Crop boxes live in assets-src/artworks/manifest.json. No colour filters
 * are applied: only crop, resize (never upscale) and WebP encoding.
 * Usage: npm run images:artworks
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'assets-src/artworks'
const OUT = 'public/images/artworks'
const WIDTHS = [480, 960]
const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'))
const report = {}

for (const [slug, cfg] of Object.entries(manifest)) {
  if (slug.startsWith('$')) continue
  const file = readdirSync(join(SRC, slug)).find((f) => f.startsWith('original.'))
  if (!file) throw new Error(`No original for ${slug}`)
  const cropped = sharp(join(SRC, slug, file))
    .rotate()
    .extract(cfg.crop)
  const { width: cw } = cfg.crop
  mkdirSync(join(OUT, slug), { recursive: true })
  report[slug] = []
  for (const w of WIDTHS) {
    const width = Math.min(w, cw) // never upscale
    const out = join(OUT, slug, `artwork-${cfg.name}-${width}.webp`)
    const info = await cropped.clone().resize({ width }).webp({ quality: 82 }).toFile(out)
    report[slug].push({
      file: out.split('\\').join('/'),
      width: info.width,
      height: info.height,
      kb: Math.round(info.size / 1024),
    })
    if (width === cw) break
  }
}
writeFileSync(join(OUT, 'manifest.generated.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))

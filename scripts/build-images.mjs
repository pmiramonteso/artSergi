/**
 * Builds web derivatives from preserved source photos.
 *   assets-src/<group>/<slug>/original.*   (never modified)
 *   → public/images/<group>/<slug>/<prefix>-<name>-<width>.webp
 * Each group has a manifest.json (optional crop per entry). Only crop,
 * resize (never upscale) and WebP encoding are applied: no colour filters.
 * Output contains NO metadata (EXIF/XMP/IPTC are stripped by sharp).
 * Usage: npm run images
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import sharp from 'sharp'

const GROUPS = [
  { group: 'artworks', prefix: 'artwork-', widths: [240, 480, 960] },
  { group: 'artist', prefix: '', widths: [480, 960, 1400] },
]

const report = {}
for (const { group, prefix, widths } of GROUPS) {
  const SRC = join('assets-src', group)
  const OUT = join('public/images', group)
  const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'))
  for (const [slug, cfg] of Object.entries(manifest)) {
    if (slug.startsWith('$')) continue
    const file = readdirSync(join(SRC, slug)).find((f) => f.startsWith('original.'))
    if (!file) throw new Error(`No original for ${group}/${slug}`)
    let base = sharp(join(SRC, slug, file)).rotate()
    if (cfg.crop) base = base.extract(cfg.crop)
    const fullWidth = cfg.crop?.width ?? (await sharp(join(SRC, slug, file)).metadata()).width
    mkdirSync(join(OUT, slug), { recursive: true })
    const key = `${group}/${slug}`
    report[key] = []
    for (const w of widths) {
      const width = Math.min(w, fullWidth) // never upscale
      const out = join(OUT, slug, `${prefix}${cfg.name}-${width}.webp`)
      const info = await base.clone().resize({ width }).webp({ quality: 82 }).toFile(out)
      report[key].push({
        file: out.split(sep).join('/'),
        width: info.width,
        height: info.height,
        kb: Math.round(info.size / 1024),
      })
      if (width === fullWidth) break
    }
  }
}
writeFileSync('assets-src/images.generated.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))

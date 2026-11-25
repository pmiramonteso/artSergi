/**
 * Vectorizes Sergi's handwritten signature (raster, black on white) into an
 * SVG for the hero. It traces the strokes; nothing is redrawn.
 *   assets-src/lettering/original.png  (never modified)
 *   → public/illustrations/lettering/hero-lettering.svg
 * Steps: flatten on white → greyscale → trim to the ink (+margin) →
 * potrace (dev-only tool) → fill with the brand ink colour.
 * Usage: npm run lettering
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import potrace from 'potrace'

const SRC = 'assets-src/lettering/original.png'
const OUT_DIR = 'public/illustrations/lettering'
const INK = '#25251f'
const MARGIN = 24

// Bounding box of the ink (pixels darker than mid-grey), plus a margin.
const grey = await sharp(SRC)
  .flatten({ background: '#ffffff' })
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true })
const { width: W, height: H } = grey.info
let minX = W,
  minY = H,
  maxX = -1,
  maxY = -1
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (grey.data[y * W + x] < 128) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}
if (maxX < 0) throw new Error('No ink found in the signature image')
const box = {
  left: Math.max(0, minX - MARGIN),
  top: Math.max(0, minY - MARGIN),
  width: Math.min(W, maxX + MARGIN + 1) - Math.max(0, minX - MARGIN),
  height: Math.min(H, maxY + MARGIN + 1) - Math.max(0, minY - MARGIN),
}
const trimmed = await sharp(SRC)
  .flatten({ background: '#ffffff' })
  .greyscale()
  .extract(box)
  .png()
  .toBuffer({ resolveWithObject: true })

const svg = await new Promise((resolve, reject) =>
  potrace.trace(
    trimmed.data,
    { threshold: 160, turdSize: 4, optTolerance: 0.25, color: INK, background: 'transparent' },
    (err, out) => (err ? reject(err) : resolve(out)),
  ),
)

const { width, height } = trimmed.info
const clean = svg
  .replace(
    /<svg[^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">`,
  )
  .replace(/\s*<rect[^>]*fill="transparent"[^>]*\/>/, '')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(`${OUT_DIR}/hero-lettering.svg`, clean + '\n')
console.log(JSON.stringify({ width, height, bytes: Buffer.byteLength(clean) }))

/**
 * Default social-sharing image (Open Graph / Twitter), 1200×630, composed
 * only from real assets: two of Sergi's paintings and his signature on the
 * brand paper colour. Usage: npm run og
 */
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const W = 1200
const H = 630
const PAPER = '#f0ebe0'
const OUT = 'public/og/default.jpg'

/** A painting on a paper mat with a soft shadow, slightly rotated. */
async function framed(src, width, angle) {
  const art = await sharp(src).resize({ width }).toBuffer({ resolveWithObject: true })
  const pad = Math.round(width * 0.04)
  const matted = await sharp({
    create: {
      width: art.info.width + pad * 2,
      height: art.info.height + pad * 2,
      channels: 4,
      background: '#f5f1e8',
    },
  })
    .composite([{ input: art.data, left: pad, top: pad }])
    .png()
    .toBuffer({ resolveWithObject: true })
  const { width: mw, height: mh } = matted.info
  // sharp applies blur/rotate before composite within one pipeline, so each
  // step is materialized separately.
  const blur = 16
  const canvas = { width: mw + blur * 6, height: mh + blur * 6 }
  const shadowShape = await sharp({
    create: { ...canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: mw,
            height: mh,
            channels: 4,
            background: { r: 37, g: 37, b: 31, alpha: 0.3 },
          },
        })
          .png()
          .toBuffer(),
        left: blur * 3,
        top: blur * 3 + 12,
      },
    ])
    .png()
    .toBuffer()
  const shadow = await sharp(shadowShape).blur(blur).png().toBuffer()
  const withArt = await sharp(shadow)
    .composite([{ input: matted.data, left: blur * 3, top: blur * 3 }])
    .png()
    .toBuffer()
  return sharp(withArt)
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true })
}

const car = await framed(
  'public/images/artworks/painting-001/artwork-car-suitcases-610.webp',
  300,
  -5,
)
const climber = await framed(
  'public/images/artworks/painting-002/artwork-cloud-climber-668.webp',
  250,
  6,
)
const signature = await sharp('public/illustrations/lettering/hero-lettering.svg', { density: 144 })
  .resize({ width: 540 })
  .png()
  .toBuffer({ resolveWithObject: true })

// Brand colour fields (as on the site's Living Canvas).
const fields = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="-40" y="-30" width="290" height="190" fill="#3456cf" transform="rotate(-6 100 60)"/>
  <circle cx="1120" cy="560" r="150" fill="#e76c4d"/>
  <rect x="840" y="40" width="250" height="56" fill="#d8bb68" transform="rotate(3 960 70)"/>
</svg>`)

mkdirSync('public/og', { recursive: true })
const info = await sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
  .composite([
    { input: fields, left: 0, top: 0 },
    { input: car.data, left: 30, top: Math.round((H - car.info.height) / 2) },
    { input: climber.data, left: 245, top: H - climber.info.height + 40 },
    {
      input: signature.data,
      left: W - signature.info.width - 30,
      top: Math.round((H - signature.info.height) / 2) - 20,
    },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT)
console.log(
  JSON.stringify({
    out: OUT,
    width: info.width,
    height: info.height,
    kb: Math.round(info.size / 1024),
  }),
)

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'
import sharp, { type Metadata } from 'sharp'

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const ACCEPTED = new Set(['jpeg', 'png', 'webp', 'tiff'])
const MASTER_MAX = 2400
const WIDTHS = [240, 480, 960]

export class MediaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MediaError'
  }
}

export interface ProcessedImage {
  hash: string
  master: Buffer
  width: number
  height: number
  variants: Array<{ width: number; height: number; data: Buffer }>
}

/**
 * Validate and process an uploaded artwork photo:
 * - the real format is detected from the bytes (not the file name);
 * - huge images are refused (decompression-bomb guard);
 * - EXIF orientation applied, ALL metadata stripped (GPS, camera, editor);
 * - optimized master (≤ 2400 px, JPEG q88) + WebP 240/480/960 (never upscaled);
 * - names derive from a content hash, so files are immutable and cacheable.
 */
export async function processArtworkImage(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new MediaError('File too large (max 20 MB)')
  let meta: Metadata
  try {
    meta = await sharp(input, { limitInputPixels: 100_000_000 }).metadata()
  } catch {
    throw new MediaError('Not a valid image')
  }
  if (!meta.format || !ACCEPTED.has(meta.format)) {
    throw new MediaError('Unsupported format (use JPEG, PNG, WebP or TIFF)')
  }

  const master = await sharp(input, { limitInputPixels: 100_000_000 })
    .rotate()
    .resize({ width: MASTER_MAX, height: MASTER_MAX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer({ resolveWithObject: true })

  const { width, height } = master.info
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, width)))]
  const variants = await Promise.all(
    widths.map(async (w) => {
      const out = await sharp(master.data).resize({ width: w }).webp({ quality: 82 }).toBuffer({
        resolveWithObject: true,
      })
      return { width: out.info.width, height: out.info.height, data: out.data }
    }),
  )
  const hash = createHash('sha256').update(master.data).digest('hex').slice(0, 12)
  return { hash, master: master.data, width, height, variants }
}

/** Write processed files under <uploads>/artworks/<slug>/ and return the public image record. */
export async function saveArtworkImage(uploadsDir: string, slug: string, img: ProcessedImage) {
  const dir = join(uploadsDir, 'artworks', slug)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${img.hash}-master.jpg`), img.master)
  for (const v of img.variants) await writeFile(join(dir, `${img.hash}-${v.width}.webp`), v.data)
  const largest = img.variants.at(-1)!
  const url = (w: number) => `/media/artworks/${slug}/${img.hash}-${w}.webp`
  return {
    src: url(largest.width),
    srcset: img.variants.map((v) => `${url(v.width)} ${v.width}w`).join(', '),
    width: largest.width,
    height: largest.height,
  }
}

/**
 * Resolve a requested media path safely inside the uploads root. Only the
 * public WebP variants are served (masters stay private). Returns null for
 * anything outside the root, hidden files or other extensions.
 */
export function safeMediaPath(root: string, requested: string): string | null {
  if (!requested || requested.includes('\0')) return null
  const decoded = (() => {
    try {
      return decodeURIComponent(requested)
    } catch {
      return null
    }
  })()
  if (!decoded || isAbsolute(decoded) || decoded.split(/[/\\]/).some((p) => p.startsWith('.'))) {
    return null
  }
  if (!/^[a-z0-9/_-]+\.webp$/i.test(decoded)) return null
  const full = resolve(root, normalize(decoded))
  const rel = relative(resolve(root), full)
  if (rel.startsWith('..') || isAbsolute(rel) || rel.split(sep).includes('..')) return null
  return full
}

export function resolveUploadsDir(configured: unknown): string {
  const dir =
    typeof configured === 'string' && configured.trim() ? configured.trim() : '.data/uploads'
  return resolve(process.cwd(), dir)
}

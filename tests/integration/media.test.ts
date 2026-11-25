import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { eq } from 'drizzle-orm'
import { seedDatabase } from '../../server/database/seed'
import { adminAuditLogs, artworks, users } from '../../server/database/schema'
import { createArtwork, setArtworkImage, AdminError } from '../../server/services/admin'
import { contentRepositories } from '../../server/services/content'
import {
  MediaError,
  processArtworkImage,
  safeMediaPath,
  saveArtworkImage,
} from '../../server/services/media'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

const photo = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#3456cf' } })
    .withExif({ IFD0: { Make: 'TestCam', Artist: 'Someone', ImageDescription: 'secret location' } })
    .jpeg()
    .toBuffer()

describe('processArtworkImage', () => {
  it('strips metadata, caps the master at 2400 px and builds WebP variants', async () => {
    const out = await processArtworkImage(await photo(3600, 4800))
    expect(Math.max(out.width, out.height)).toBeLessThanOrEqual(2400)
    expect(out.variants.map((v) => v.width)).toEqual([240, 480, 960])
    const meta = await sharp(out.master).metadata()
    expect(meta.exif).toBeUndefined()
    for (const v of out.variants) {
      const m = await sharp(v.data).metadata()
      expect(m.format).toBe('webp')
      expect(m.exif).toBeUndefined()
    }
    expect(out.hash).toMatch(/^[0-9a-f]{12}$/)
  })

  it('never upscales small photos', async () => {
    const out = await processArtworkImage(await photo(300, 400))
    expect(out.variants.map((v) => v.width)).toEqual([240, 300])
  })

  it('rejects non-images and unsupported formats by content, not by name', async () => {
    await expect(processArtworkImage(Buffer.from('not an image'))).rejects.toBeInstanceOf(
      MediaError,
    )
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')
    await expect(processArtworkImage(svg)).rejects.toThrow(/Unsupported format/)
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } })
      .gif()
      .toBuffer()
    await expect(processArtworkImage(gif)).rejects.toThrow(/Unsupported format/)
  })

  it('rejects oversized uploads', async () => {
    await expect(processArtworkImage(Buffer.alloc(21 * 1024 * 1024))).rejects.toThrow(/too large/)
  })
})

describe('safeMediaPath', () => {
  const root = join(tmpdir(), 'uploads-root')
  it('allows public webp variants inside the root', () => {
    expect(safeMediaPath(root, 'artworks/painting-004/abc123-480.webp')).toBe(
      join(root, 'artworks', 'painting-004', 'abc123-480.webp'),
    )
  })
  it.each([
    '../secret.webp',
    'artworks/../../etc/passwd.webp',
    '%2e%2e/%2e%2e/x.webp',
    '/etc/x.webp',
    'artworks/.hidden.webp',
    'artworks/x/abc-master.jpg',
    'artworks/x/a.webp\0.jpg',
    '',
  ])('refuses %s', (p) => {
    expect(safeMediaPath(root, p)).toBeNull()
  })
})

describe('creating artworks with photos', () => {
  let db: Database
  let close: () => Promise<void>
  let actor: string
  let uploads: string

  beforeAll(async () => {
    ;({ db, close } = await createTestDatabase())
    await seedDatabase(db)
    actor = (
      await db
        .insert(users)
        .values({ name: 'A', email: 'a@example.com', role: 'admin' })
        .returning()
    )[0]!.id
    uploads = await mkdtemp(join(tmpdir(), 'artsergi-uploads-'))
  })
  afterAll(async () => {
    await close()
    await rm(uploads, { recursive: true, force: true })
  })

  it('creates an artwork at the end of the list, audited', async () => {
    await createArtwork(db, actor, {
      slug: 'new-painting',
      status: 'available',
      year: 2026,
      translations: { en: { title: 'New Painting' } },
    })
    const rows = await db.select().from(artworks).orderBy(artworks.sortOrder)
    expect(rows.at(-1)!.slug).toBe('new-painting')
    const [log] = await db
      .select()
      .from(adminAuditLogs)
      .where(eq(adminAuditLogs.action, 'artwork.create'))
    expect(log!.entityId).toBe('new-painting')
  })

  it('refuses duplicate slugs', async () => {
    await expect(
      createArtwork(db, actor, { slug: 'new-painting', status: 'sold' }),
    ).rejects.toBeInstanceOf(AdminError)
  })

  it('stores the photo and publishes it with alt text (falling back to English)', async () => {
    const processed = await processArtworkImage(await photo(1600, 2000))
    const image = await saveArtworkImage(uploads, 'new-painting', processed)
    await setArtworkImage(db, actor, 'new-painting', image, {
      en: 'A blue rectangle painting test',
    })

    const files = await readdir(join(uploads, 'artworks', 'new-painting'))
    expect(files.filter((f) => f.endsWith('.webp'))).toHaveLength(3)
    expect(files.some((f) => f.endsWith('-master.jpg'))).toBe(true)

    const es = await contentRepositories(db).artworks.findBySlug('new-painting', 'es')
    expect(es?.image?.src).toMatch(/^\/media\/artworks\/new-painting\/[0-9a-f]{12}-960\.webp$/)
    expect(es?.image?.alt).toBe('A blue rectangle painting test')
    expect(es?.image?.srcset).toContain('240w')
    expect(es?.title).toBe('New Painting')
  })
})

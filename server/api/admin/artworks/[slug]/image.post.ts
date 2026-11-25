import { imageAltSchema } from '#shared/schemas/admin'
import { slugParamSchema } from '#shared/schemas/content'
import { setArtworkImage } from '../../../../services/admin'
import {
  MAX_UPLOAD_BYTES,
  MediaError,
  processArtworkImage,
  resolveUploadsDir,
  saveArtworkImage,
} from '../../../../services/media'

/**
 * POST /api/admin/artworks/:slug/image — multipart form with `file` (photo)
 * and `alt_en` (required), `alt_es`, `alt_ca`. The image is validated and
 * re-encoded server-side (metadata stripped) before anything is stored.
 */
export default defineAdminHandler(async ({ event, db, actorId }) => {
  const p = await getValidatedRouterParams(event, (x) => slugParamSchema.safeParse(x))
  if (!p.success) throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })

  const parts = (await readMultipartFormData(event)) ?? []
  const field = (name: string) =>
    parts.find((x) => x.name === name && !x.filename)?.data.toString('utf8')
  const file = parts.find((x) => x.name === 'file' && x.filename)
  if (!file?.data.length) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  if (file.data.byteLength > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File too large (max 20 MB)' })
  }
  const alt = imageAltSchema.safeParse({
    en: field('alt_en') ?? '',
    ...(field('alt_es') ? { es: field('alt_es') } : {}),
    ...(field('alt_ca') ? { ca: field('alt_ca') } : {}),
  })
  if (!alt.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'English alt text is required (10+ characters)',
    })
  }

  try {
    const processed = await processArtworkImage(file.data)
    const uploads = resolveUploadsDir(useRuntimeConfig(event).uploadsDir)
    const image = await saveArtworkImage(uploads, p.data.slug, processed)
    await setArtworkImage(db, actorId, p.data.slug, image, alt.data)
    return { image }
  } catch (err) {
    if (err instanceof MediaError)
      throw createError({ statusCode: 400, statusMessage: err.message })
    throw err
  }
})

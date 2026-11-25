import { readFile, stat } from 'node:fs/promises'
import { resolveUploadsDir, safeMediaPath } from '../../services/media'

/**
 * GET /media/** — admin-uploaded artwork images (WebP variants only).
 * File names contain a content hash, so they can be cached forever.
 */
export default defineEventHandler(async (event) => {
  const root = resolveUploadsDir(useRuntimeConfig(event).uploadsDir)
  const file = safeMediaPath(root, getRouterParam(event, 'path') ?? '')
  if (!file) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  try {
    const info = await stat(file)
    if (!info.isFile()) throw new Error('not a file')
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  setResponseHeaders(event, {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  })
  return readFile(file)
})

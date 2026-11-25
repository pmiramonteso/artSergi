import { localeQuerySchema, slugParamSchema } from '#shared/schemas/content'
import type { LocaleCode } from '#shared/constants/i18n'
import type { Artwork } from '#shared/types/artwork'
import { contentRepositories } from '../../services/content'

/** GET /api/artworks/:slug?locale=en */
export default defineEventHandler(async (event): Promise<Artwork> => {
  const params = await getValidatedRouterParams(event, (p) => slugParamSchema.safeParse(p))
  const query = await getValidatedQuery(event, (q) => localeQuerySchema.safeParse(q))
  // Malformed slugs are simply "not found": nothing to learn from the error.
  if (!params.success) throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid query' })

  const artwork = await contentRepositories(useDatabase()).artworks.findBySlug(
    params.data.slug,
    query.data.locale as LocaleCode,
  )
  if (!artwork) throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  return artwork
})

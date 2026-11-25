import { localeQuerySchema } from '#shared/schemas/content'
import type { LocaleCode } from '#shared/constants/i18n'
import type { Artwork } from '#shared/types/artwork'
import { contentRepositories } from '../../services/content'

/** GET /api/artworks?locale=en: public artwork list (no internal fields). */
export default defineEventHandler(async (event): Promise<{ data: Artwork[] }> => {
  const query = await getValidatedQuery(event, (q) => localeQuerySchema.safeParse(q))
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  const data = await contentRepositories(useDatabase()).artworks.list(
    query.data.locale as LocaleCode,
  )
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  return { data }
})

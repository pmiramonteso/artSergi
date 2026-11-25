import { slugParamSchema } from '#shared/schemas/content'
import type { Collection } from '#shared/types/collection'
import { contentRepositories } from '../../services/content'

/** GET /api/collections/:slug: public collection (all locales). */
export default defineEventHandler(async (event): Promise<Collection> => {
  const params = await getValidatedRouterParams(event, (p) => slugParamSchema.safeParse(p))
  if (!params.success) throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
  const collection = await contentRepositories(useDatabase()).collections.findBySlug(
    params.data.slug,
  )
  if (!collection) throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  return collection
})

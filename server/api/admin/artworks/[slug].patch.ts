import { artworkUpdateSchema, type ArtworkUpdate } from '#shared/schemas/admin'
import { slugParamSchema } from '#shared/schemas/content'
import { updateArtwork } from '../../../services/admin'

export default defineAdminHandler(async ({ event, db, actorId }) => {
  const p = await getValidatedRouterParams(event, (x) => slugParamSchema.safeParse(x))
  if (!p.success) throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  const body = (await validBody(event, artworkUpdateSchema)) as ArtworkUpdate
  await updateArtwork(db, actorId, p.data.slug, body)
  return { ok: true }
})

import { artworkCreateSchema, type ArtworkCreate } from '#shared/schemas/admin'
import { createArtwork } from '../../../services/admin'

/** POST /api/admin/artworks — create an artwork (photo is uploaded separately). */
export default defineAdminHandler(async ({ event, db, actorId }) => {
  const body = (await validBody(event, artworkCreateSchema)) as ArtworkCreate
  const row = await createArtwork(db, actorId, body)
  setResponseStatus(event, 201)
  return { slug: row.slug }
})

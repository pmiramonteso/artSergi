import { productUpdateSchema, uuidParam } from '#shared/schemas/admin'
import { updateProduct } from '../../../services/admin'

export default defineAdminHandler(async ({ event, db, actorId }) => {
  const p = await getValidatedRouterParams(event, (x) => uuidParam.safeParse(x))
  if (!p.success) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  const body = (await validBody(event, productUpdateSchema)) as { active: boolean }
  await updateProduct(db, actorId, p.data.id, body.active)
  return { ok: true }
})

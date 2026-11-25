import { uuidParam, variantUpdateSchema } from '#shared/schemas/admin'
import { updateVariant } from '../../../services/admin'

export default defineAdminHandler(async ({ event, db, actorId }) => {
  const p = await getValidatedRouterParams(event, (x) => uuidParam.safeParse(x))
  if (!p.success) throw createError({ statusCode: 404, statusMessage: 'Variant not found' })
  const body = (await validBody(event, variantUpdateSchema)) as {
    priceAmount?: number
    active?: boolean
  }
  await updateVariant(db, actorId, p.data.id, body)
  return { ok: true }
})

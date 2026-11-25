import { orderUpdateSchema, uuidParam, type OrderUpdate } from '#shared/schemas/admin'
import { updateOrder } from '../../../services/admin'

export default defineAdminHandler(async ({ event, db, actorId }) => {
  const p = await getValidatedRouterParams(event, (x) => uuidParam.safeParse(x))
  if (!p.success) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  const body = (await validBody(event, orderUpdateSchema)) as OrderUpdate
  await updateOrder(db, actorId, p.data.id, body)
  return { ok: true }
})

import { uuidParam } from '#shared/schemas/admin'
import { getOrder } from '../../../services/admin'

export default defineAdminHandler(async ({ event, db }) => {
  const p = await getValidatedRouterParams(event, (x) => uuidParam.safeParse(x))
  if (!p.success) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  return getOrder(db, p.data.id)
})

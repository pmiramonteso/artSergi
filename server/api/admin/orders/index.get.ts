import { listQuery } from '#shared/schemas/admin'
import { listOrders } from '../../../services/admin'

export default defineAdminHandler(async ({ event, db }) => {
  const q = await getValidatedQuery(event, (x) => listQuery.safeParse(x))
  if (!q.success) throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  return listOrders(db, q.data)
})

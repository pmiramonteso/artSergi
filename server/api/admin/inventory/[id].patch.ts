import { inventoryUpdateSchema, uuidParam } from '#shared/schemas/admin'
import { updateInventory } from '../../../services/admin'

export default defineAdminHandler(async ({ event, db, actorId }) => {
  const p = await getValidatedRouterParams(event, (x) => uuidParam.safeParse(x))
  if (!p.success) throw createError({ statusCode: 404, statusMessage: 'Inventory not found' })
  const body = (await validBody(event, inventoryUpdateSchema)) as { quantityTotal: number }
  await updateInventory(db, actorId, p.data.id, body.quantityTotal)
  return { ok: true }
})

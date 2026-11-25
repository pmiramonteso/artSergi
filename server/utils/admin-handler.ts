import type { H3Event } from 'h3'
import { AdminError } from '../services/admin'

/**
 * Wraps an admin endpoint: authorization (role + MFA) is checked FIRST, for
 * every request, then the handler runs with the database and actor id.
 * Admin responses are never cached.
 */
export function defineAdminHandler<T>(
  fn: (ctx: {
    event: H3Event
    db: ReturnType<typeof requireDatabase>
    actorId: string
  }) => Promise<T>,
) {
  return defineEventHandler(async (event) => {
    const user = await requireAdmin(event)
    setResponseHeader(event, 'Cache-Control', 'no-store')
    try {
      return await fn({ event, db: requireDatabase(), actorId: user.id })
    } catch (err) {
      if (err instanceof AdminError) {
        throw createError({ statusCode: err.status, statusMessage: err.message })
      }
      if ((err as { code?: string }).code === '23514') {
        throw createError({ statusCode: 409, statusMessage: 'Violates a data integrity rule' })
      }
      throw err
    }
  })
}

export async function validBody<S extends { safeParse: (v: unknown) => { success: boolean } }>(
  event: H3Event,
  schema: S,
) {
  const r = (await readValidatedBody(event, (b) => schema.safeParse(b))) as ReturnType<
    S['safeParse']
  >
  if (!r.success) throw createError({ statusCode: 400, statusMessage: 'Invalid data' })
  return (r as unknown as { data: unknown }).data
}

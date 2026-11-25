import { sql } from 'drizzle-orm'

/**
 * Readiness probe for uptime monitoring: checks the database when one is
 * configured. Returns only "ok"/"degraded": no versions, hosts or errors.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const db = useDatabase()
  if (!db) return { status: 'ok', database: 'not-configured' }
  try {
    await db.execute(sql`select 1`)
    return { status: 'ok', database: 'ok' }
  } catch {
    setResponseStatus(event, 503)
    return { status: 'degraded', database: 'unavailable' }
  }
})

import { createDatabase, type Database } from '../database/client'

let instance: { db: Database; close: () => Promise<void> } | null | undefined

/**
 * Lazily-created database for this server process, or `null` when
 * NUXT_DATABASE_URL is not configured. Without a database the public site
 * serves the static content in app/data (same shape), so previews keep
 * working; commerce features (Phase 8+) require a database.
 */
export function useDatabase(): Database | null {
  if (instance === undefined) {
    const { databaseUrl } = useRuntimeConfig()
    instance = databaseUrl ? createDatabase(databaseUrl) : null
  }
  return instance?.db ?? null
}

export function requireDatabase(): Database {
  const db = useDatabase()
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Service temporarily unavailable' })
  }
  return db
}

export async function closeDatabase() {
  await instance?.close()
  instance = undefined
}

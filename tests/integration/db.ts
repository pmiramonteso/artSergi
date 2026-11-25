import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { fileURLToPath } from 'node:url'
import * as schema from '../../server/database/schema'
import type { Database } from '../../server/database/client'

/** Fresh in-memory Postgres with all migrations applied. */
export async function createTestDatabase(): Promise<{ db: Database; close: () => Promise<void> }> {
  const client = new PGlite()
  const db = drizzle({ client, schema })
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../server/database/migrations', import.meta.url)),
  })
  return { db: db as unknown as Database, close: () => client.close() }
}

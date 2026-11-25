import { drizzle } from 'drizzle-orm/postgres-js'
import type { PgDatabase } from 'drizzle-orm/pg-core'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Any Drizzle Postgres database bound to our schema: postgres.js in the app,
 * PGlite in tests. Repositories and services depend on this type only.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = PgDatabase<any, typeof schema>

export { schema }

export function createDatabase(url: string): { db: Database; close: () => Promise<void> } {
  const client = postgres(url, {
    // Small pool: shared 2 GB hosting, one Node process.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Never print query parameters (may contain personal data).
    debug: false,
    onnotice: () => {},
  })
  return { db: drizzle({ client, schema }), close: () => client.end({ timeout: 5 }) }
}

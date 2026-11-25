import { drizzle } from 'drizzle-orm/mysql2'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

/**
 * Drizzle database bound to our schema (MySQL 8.4 via mysql2). Repositories
 * and services depend on this type only.
 */
export type Database = MySql2Database<typeof schema>

export { schema }

export function createPool(url: string, opts: { connectionLimit?: number } = {}) {
  const pool = mysql.createPool({
    uri: url,
    // Small pool: shared hosting, one Node process.
    connectionLimit: opts.connectionLimit ?? 5,
    connectTimeout: 10_000,
    waitForConnections: true,
    // All datetimes are UTC, in the driver and in the session.
    timezone: 'Z',
    charset: 'utf8mb4',
    supportBigNumbers: true,
    enableKeepAlive: true,
  })
  pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+00:00'")
  })
  return pool
}

export function createDatabase(url: string): { db: Database; close: () => Promise<void> } {
  const pool = createPool(url)
  return {
    db: drizzle({ client: pool, schema, mode: 'default' }),
    close: () => pool.end(),
  }
}

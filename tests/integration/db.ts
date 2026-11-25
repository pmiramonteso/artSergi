import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import mysql from 'mysql2/promise'
import * as schema from '../../server/database/schema'
import { createPool, type Database } from '../../server/database/client'

/**
 * Integration tests run against a real MySQL 8.4 server (same as production):
 * TEST_MYSQL_URL=mysql://root:pass@127.0.0.1:3306 (no database in the path).
 * Each call creates a fresh, uniquely named database with all migrations
 * applied, and drops it on close.
 */
export const TEST_MYSQL_URL = process.env.TEST_MYSQL_URL ?? ''
export const hasTestDb = TEST_MYSQL_URL !== ''

export async function createTestDatabase(): Promise<{ db: Database; close: () => Promise<void> }> {
  if (!hasTestDb) throw new Error('TEST_MYSQL_URL is not set')
  const name = `t_${randomBytes(6).toString('hex')}`
  const admin = await mysql.createConnection({ uri: TEST_MYSQL_URL })
  await admin.query(`CREATE DATABASE \`${name}\``)
  const base = new URL(TEST_MYSQL_URL)
  base.pathname = `/${name}`
  const pool = createPool(base.toString(), { connectionLimit: 10 })
  const db = drizzle({ client: pool, schema, mode: 'default' })
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../server/database/migrations', import.meta.url)),
  })
  return {
    db,
    close: async () => {
      await pool.end()
      await admin.query(`DROP DATABASE \`${name}\``)
      await admin.end()
    },
  }
}

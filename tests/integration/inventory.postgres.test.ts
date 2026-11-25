import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../../server/database/schema'
import { seedDatabase } from '../../server/database/seed'
import { availableQuantity, reserveStock } from '../../server/services/inventory'
import type { Database } from '../../server/database/client'

/**
 * Real concurrency against a real PostgreSQL server (many connections at
 * once), which PGlite cannot simulate. Runs only when TEST_DATABASE_URL
 * points to a disposable server, e.g. the docker compose database:
 *   TEST_DATABASE_URL=postgres://artsergi:artsergi@localhost:5432/artsergi npm test
 * It creates and drops its own temporary database.
 */
const adminUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!adminUrl)('inventory under real concurrency (PostgreSQL)', () => {
  const dbName = `test_${randomUUID().replace(/-/g, '')}`
  let admin: postgres.Sql
  let client: postgres.Sql
  let db: Database

  beforeAll(async () => {
    admin = postgres(adminUrl!, { max: 1 })
    await admin.unsafe(`CREATE DATABASE ${dbName}`)
    const url = new URL(adminUrl!)
    url.pathname = `/${dbName}`
    client = postgres(url.toString(), { max: 20, onnotice: () => {} })
    db = drizzle({ client, schema }) as unknown as Database
    await migrate(db as never, {
      migrationsFolder: fileURLToPath(new URL('../../server/database/migrations', import.meta.url)),
    })
    await seedDatabase(db)
  })

  afterAll(async () => {
    await client?.end({ timeout: 5 })
    await admin?.unsafe(`DROP DATABASE IF EXISTS ${dbName}`)
    await admin?.end({ timeout: 5 })
  })

  it('200 simultaneous checkouts for 50 units: exactly 50 succeed', async () => {
    const [v] = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.sku, 'ART-MAIL-SINGLE'))
    const results = await Promise.allSettled(
      Array.from({ length: 200 }, (_, i) =>
        reserveStock(db, { variantId: v!.id, quantity: 1, reference: `c-${i}`, ttlMs: 60_000 }),
      ),
    )
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(50)
    expect(await availableQuantity(db, v!.id)).toBe(0)
  })
})

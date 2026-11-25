import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { artists } from '../database/schema'
import { seedDatabase } from '../database/seed'

/**
 * Opt-in migrations at startup, for hosts where only the built `.output`
 * is deployed (cPanel). Enable ONLY for a deploy, with a fresh backup:
 *   NUXT_DB_MIGRATE_ON_START=true
 * The build copies SQL migrations to .output/server/migrations. If a
 * migration fails the process exits instead of serving an incompatible
 * schema. Migrations are forward-only and must stay backward compatible
 * with the previous release (expand → deploy → contract).
 *
 * NUXT_DB_SEED_ON_START=true loads the initial content (artworks, collection,
 * inactive offers) ONLY into an empty database (first install). It never
 * touches a database that already has content, so admin edits are safe.
 */
export default defineNitroPlugin(async () => {
  const { dbMigrateOnStart, dbSeedOnStart } = useRuntimeConfig()
  if (dbMigrateOnStart !== true && dbSeedOnStart !== true) return
  const db = useDatabase()
  if (!db) throw new Error('[migrate] migrate/seed on start is set but there is no database')
  if (dbMigrateOnStart === true) await runMigrations(db)
  if (dbSeedOnStart === true) await seedIfEmpty(db)
})

async function seedIfEmpty(db: NonNullable<ReturnType<typeof useDatabase>>) {
  try {
    const [existing] = await db.select({ id: artists.id }).from(artists).limit(1)
    if (existing) {
      console.info(JSON.stringify({ level: 'info', msg: 'seed skipped: database has content' }))
      return
    }
    const result = await seedDatabase(db)
    console.info(JSON.stringify({ level: 'info', msg: 'initial content seeded', ...result }))
  } catch (err) {
    console.error(
      JSON.stringify({ level: 'error', msg: 'seed failed', error: (err as Error).message }),
    )
  }
}

async function runMigrations(db: NonNullable<ReturnType<typeof useDatabase>>) {
  const candidates = [
    process.env.NUXT_DB_MIGRATIONS_DIR,
    // Source tree first (dev), so a stale .output build is never used.
    join(process.cwd(), 'server/database/migrations'),
    join(process.cwd(), '.output/server/migrations'),
    join(process.cwd(), 'server/migrations'),
  ].filter((p): p is string => !!p)
  const folder = candidates.find((p) => existsSync(join(p, 'meta/_journal.json')))
  if (!folder) throw new Error('[migrate] migrations folder not found')

  try {
    await migrate(db as never, { migrationsFolder: folder })
    console.info(JSON.stringify({ level: 'info', msg: 'migrations applied', folder }))
  } catch (err) {
    console.error(
      JSON.stringify({ level: 'fatal', msg: 'migration failed', error: (err as Error).message }),
    )
    process.exit(1)
  }
}

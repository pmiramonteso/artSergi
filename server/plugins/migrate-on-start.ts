import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

/**
 * Opt-in migrations at startup, for hosts where only the built `.output`
 * is deployed (cPanel). Enable ONLY for a deploy, with a fresh backup:
 *   NUXT_DB_MIGRATE_ON_START=true
 * The build copies SQL migrations to .output/server/migrations. If a
 * migration fails the process exits instead of serving an incompatible
 * schema. Migrations are forward-only and must stay backward compatible
 * with the previous release (expand → deploy → contract).
 */
export default defineNitroPlugin(async () => {
  const { dbMigrateOnStart } = useRuntimeConfig()
  if (dbMigrateOnStart !== true) return
  const db = useDatabase()
  if (!db) throw new Error('[migrate] NUXT_DB_MIGRATE_ON_START is set but there is no database')

  const candidates = [
    process.env.NUXT_DB_MIGRATIONS_DIR,
    join(process.cwd(), '.output/server/migrations'),
    join(process.cwd(), 'server/migrations'),
    join(process.cwd(), 'server/database/migrations'),
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
})

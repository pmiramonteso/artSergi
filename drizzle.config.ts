import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit: `npm run db:generate` writes SQL migrations (no DB needed);
 * `npm run db:migrate` applies them to NUXT_DATABASE_URL.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema/index.ts',
  out: './server/database/migrations',
  dbCredentials: { url: process.env.NUXT_DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
})

import { seedDatabase } from '../../database/seed'

/**
 * `npm run db:seed` (with the dev server running): idempotent seed of the
 * approved content into NUXT_DATABASE_URL.
 */
export default defineTask({
  meta: { name: 'db:seed', description: 'Seed approved content (idempotent)' },
  async run() {
    const result = await seedDatabase(requireDatabase())
    return { result }
  },
})

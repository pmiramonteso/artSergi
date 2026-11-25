import { expireStaleReservations } from '../../services/inventory'

/** Returns stock held by expired checkout reservations. Scheduled every 5 min. */
export default defineTask({
  meta: { name: 'inventory:expire', description: 'Expire stale stock reservations' },
  async run() {
    const db = useDatabase()
    if (!db) return { result: 'skipped: no database' }
    const expired = await expireStaleReservations(db)
    return { result: `expired: ${expired}` }
  },
})

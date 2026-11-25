import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { seedDatabase } from '../../server/database/seed'
import { inventory, productVariants } from '../../server/database/schema'
import {
  availableQuantity,
  commitReservation,
  expireStaleReservations,
  InsufficientStockError,
  releaseReservation,
  reserveStock,
} from '../../server/services/inventory'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

let db: Database
let close: (() => Promise<void>) | undefined
let variantId: string
const TTL = 15 * 60_000

beforeEach(async () => {
  await close?.()
  ;({ db, close } = await createTestDatabase())
  await seedDatabase(db)
  const [v] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.sku, 'ART-MAIL-SINGLE'))
  variantId = v!.id
})
afterAll(() => close?.())

describe('inventory (pilot of 50)', () => {
  it('starts with the pilot edition size', async () => {
    expect(await availableQuantity(db, variantId)).toBe(50)
  })

  it('never oversells: 60 buyers competing for 50 units', async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 60 }, (_, i) =>
        reserveStock(db, { variantId, quantity: 1, reference: `checkout-${i}`, ttlMs: TTL }),
      ),
    )
    const ok = attempts.filter((a) => a.status === 'fulfilled')
    const failed = attempts.filter((a) => a.status === 'rejected')
    expect(ok).toHaveLength(50)
    expect(failed).toHaveLength(10)
    for (const f of failed)
      expect((f as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientStockError)
    expect(await availableQuantity(db, variantId)).toBe(0)
  })

  it('reserving is idempotent per reference', async () => {
    const a = await reserveStock(db, { variantId, quantity: 2, reference: 'same', ttlMs: TTL })
    const b = await reserveStock(db, { variantId, quantity: 2, reference: 'same', ttlMs: TTL })
    expect(b.id).toBe(a.id)
    expect(await availableQuantity(db, variantId)).toBe(48)
  })

  it('commit moves reserved units to sold; release returns them', async () => {
    await reserveStock(db, { variantId, quantity: 3, reference: 'paid', ttlMs: TTL })
    await reserveStock(db, { variantId, quantity: 4, reference: 'abandoned', ttlMs: TTL })
    expect(await commitReservation(db, 'paid')).toBe(1)
    expect(await releaseReservation(db, 'abandoned')).toBe(1)
    // Settling twice is a no-op (webhook retries are safe).
    expect(await commitReservation(db, 'paid')).toBe(0)
    const [row] = await db.select().from(inventory).where(eq(inventory.variantId, variantId))
    expect(row).toMatchObject({ quantitySold: 3, quantityReserved: 0 })
    expect(await availableQuantity(db, variantId)).toBe(47)
  })

  it('expired reservations return stock', async () => {
    const now = new Date('2026-01-01T10:00:00Z')
    await reserveStock(db, { variantId, quantity: 5, reference: 'old', ttlMs: 1000, now })
    expect(await availableQuantity(db, variantId)).toBe(45)
    expect(await expireStaleReservations(db, new Date('2026-01-01T10:00:02Z'))).toBe(1)
    expect(await availableQuantity(db, variantId)).toBe(50)
  })

  it('rejects invalid quantities and unknown variants', async () => {
    await expect(
      reserveStock(db, { variantId, quantity: 0, reference: 'z', ttlMs: TTL }),
    ).rejects.toThrow()
    await expect(
      reserveStock(db, {
        variantId: '00000000-0000-0000-0000-000000000000',
        quantity: 1,
        reference: 'z',
        ttlMs: TTL,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError)
  })

  it('the database itself refuses an oversell even if code is bypassed', async () => {
    await expect(
      db
        .update(inventory)
        .set({ quantitySold: sql`51` })
        .where(eq(inventory.variantId, variantId)),
    ).rejects.toThrow()
  })
})

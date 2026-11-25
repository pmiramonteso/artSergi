import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { inventory, productVariants, webhookEvents } from '../../server/database/schema'
import { seedDatabase } from '../../server/database/seed'
import { availableQuantity, reserveStock } from '../../server/services/inventory'
import { hitDbRateLimit } from '../../server/utils/rate-limit'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

/**
 * Real concurrency on MySQL 8.4 (InnoDB row locks, many pooled connections):
 * the guarantees the shop relies on must hold under simultaneous requests.
 */
let db: Database
let close: () => Promise<void>
beforeAll(async () => {
  ;({ db, close } = await createTestDatabase())
  await seedDatabase(db)
})
afterAll(() => close?.())

describe('under real concurrency (MySQL)', () => {
  it('200 simultaneous checkouts for 50 units: exactly 50 succeed, never oversold', async () => {
    const [v] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, 'ART-MAIL-SINGLE'))
    const results = await Promise.allSettled(
      Array.from({ length: 200 }, (_, i) =>
        reserveStock(db, { variantId: v!.id, quantity: 1, reference: `c-${i}`, ttlMs: 60_000 }),
      ),
    )
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(50)
    expect(await availableQuantity(db, v!.id)).toBe(0)
    const [inv] = await db.select().from(inventory).where(eq(inventory.variantId, v!.id))
    expect(inv!.quantityReserved).toBe(50)
  })

  it('the same reservation retried in parallel is taken once', async () => {
    const [v] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, 'ART-MAIL-SINGLE'))
    await db.update(inventory).set({ quantityTotal: 60 }).where(eq(inventory.variantId, v!.id))
    await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        reserveStock(db, { variantId: v!.id, quantity: 2, reference: 'same', ttlMs: 60_000 }),
      ),
    )
    expect(await availableQuantity(db, v!.id)).toBe(8)
  })

  it('rate limit counts every parallel hit exactly once', async () => {
    const now = Date.now()
    const res = await Promise.all(
      Array.from({ length: 30 }, () =>
        hitDbRateLimit(db, 'burst', { limit: 10, windowMs: 60_000, now }),
      ),
    )
    expect(res.filter((r) => r.allowed)).toHaveLength(10)
  })

  it('tokens and Stripe ids compare case-sensitively', async () => {
    await db.insert(webhookEvents).values({ id: 'evt_AbC', type: 'x' })
    await db.insert(webhookEvents).values({ id: 'evt_aBc', type: 'x' })
    expect(
      await db.select().from(webhookEvents).where(eq(webhookEvents.id, 'evt_abc')),
    ).toHaveLength(0)
  })
})

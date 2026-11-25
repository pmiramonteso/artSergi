import { randomUUID } from 'node:crypto'
import { and, eq, inArray, lt, sql } from 'drizzle-orm'
import type { Database } from '../database/client'
import { inventory, inventoryReservations } from '../database/schema'
import { affectedRows } from '../database/result'

export class InsufficientStockError extends Error {
  constructor(
    public readonly variantId: string,
    public readonly requested: number,
  ) {
    super('Insufficient stock')
    this.name = 'InsufficientStockError'
  }
}

export interface Reservation {
  id: string
  variantId: string
  quantity: number
  reference: string
  expiresAt: Date
  status: 'active' | 'committed' | 'released' | 'expired'
}

/** Units that can still be reserved right now. */
export async function availableQuantity(db: Database, variantId: string): Promise<number> {
  const [row] = await db
    .select({
      available: sql<number>`${inventory.quantityTotal} - ${inventory.quantityReserved} - ${inventory.quantitySold}`,
    })
    .from(inventory)
    .where(eq(inventory.variantId, variantId))
  return row ? Number(row.available) : 0
}

/**
 * Reserve stock for a checkout. Atomic and race-safe: the stock check and
 * the increment are ONE conditional UPDATE, so two concurrent buyers can
 * never both take the last unit (and the table CHECK constraint is a second
 * guard). Idempotent per (reference, variant): retrying returns the same
 * reservation instead of reserving twice.
 */
export async function reserveStock(
  db: Database,
  input: { variantId: string; quantity: number; reference: string; ttlMs: number; now?: Date },
): Promise<Reservation> {
  const { variantId, quantity, reference, ttlMs } = input
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Invalid quantity')
  const now = input.now ?? new Date()

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.reference, reference),
          eq(inventoryReservations.variantId, variantId),
        ),
      )
      .limit(1)
    if (existing) return existing as Reservation

    const updated = await tx
      .update(inventory)
      .set({
        quantityReserved: sql`${inventory.quantityReserved} + ${quantity}`,
        updatedAt: now,
      })
      .where(
        and(
          eq(inventory.variantId, variantId),
          sql`${inventory.quantityTotal} - ${inventory.quantityReserved} - ${inventory.quantitySold} >= ${quantity}`,
        ),
      )
    if (affectedRows(updated) === 0) throw new InsufficientStockError(variantId, quantity)

    const reservation = {
      id: randomUUID(),
      variantId,
      quantity,
      reference,
      expiresAt: new Date(now.getTime() + ttlMs),
      status: 'active' as const,
    }
    await tx.insert(inventoryReservations).values(reservation)
    return reservation
  })
}

/** Move active reservations for `reference` to a final state, adjusting stock. */
async function settle(
  db: Database,
  reference: string,
  to: 'committed' | 'released',
): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.reference, reference),
          eq(inventoryReservations.status, 'active'),
        ),
      )
      .for('update')
    if (!rows.length) return 0
    await tx
      .update(inventoryReservations)
      .set({ status: to })
      .where(
        inArray(
          inventoryReservations.id,
          rows.map((r) => r.id),
        ),
      )
    for (const r of rows) {
      await tx
        .update(inventory)
        .set({
          quantityReserved: sql`${inventory.quantityReserved} - ${r.quantity}`,
          ...(to === 'committed'
            ? { quantitySold: sql`${inventory.quantitySold} + ${r.quantity}` }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(inventory.variantId, r.variantId))
    }
    return rows.length
  })
}

/** Payment confirmed (verified webhook only): reserved units become sold. */
export const commitReservation = (db: Database, reference: string) =>
  settle(db, reference, 'committed')

/** Checkout abandoned or payment failed: units return to stock. */
export const releaseReservation = (db: Database, reference: string) =>
  settle(db, reference, 'released')

/** Return stock held by reservations past their expiry. Safe to run repeatedly. */
export async function expireStaleReservations(db: Database, now = new Date()): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(inventoryReservations)
      .where(
        and(eq(inventoryReservations.status, 'active'), lt(inventoryReservations.expiresAt, now)),
      )
      .for('update')
    if (!rows.length) return 0
    await tx
      .update(inventoryReservations)
      .set({ status: 'expired' })
      .where(
        inArray(
          inventoryReservations.id,
          rows.map((r) => r.id),
        ),
      )
    for (const r of rows) {
      await tx
        .update(inventory)
        .set({
          quantityReserved: sql`${inventory.quantityReserved} - ${r.quantity}`,
          updatedAt: now,
        })
        .where(eq(inventory.variantId, r.variantId))
    }
    return rows.length
  })
}

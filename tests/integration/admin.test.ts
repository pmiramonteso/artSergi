import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { seedDatabase } from '../../server/database/seed'
import {
  adminAuditLogs,
  artworkTranslations,
  artworks,
  customers,
  inventory,
  orders,
  productVariants,
  shipments,
  users,
} from '../../server/database/schema'
import {
  accountOverview,
  AdminError,
  listArtworksAdmin,
  updateArtwork,
  updateInventory,
  updateOrder,
  updateVariant,
} from '../../server/services/admin'
import { reserveStock } from '../../server/services/inventory'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

let db: Database
let close: (() => Promise<void>) | undefined
let actor: string

beforeEach(async () => {
  await close?.()
  ;({ db, close } = await createTestDatabase())
  await seedDatabase(db)
  const [u] = await db
    .insert(users)
    .values({ name: 'Admin', email: 'admin@example.com', emailVerified: true, role: 'admin' })
    .returning()
  actor = u!.id
})
afterAll(() => close?.())

const mkOrder = async (status: 'paid' | 'awaiting_payment', email = 'buyer@example.com') =>
  (
    await db
      .insert(orders)
      .values({
        number: `ST-${Math.random().toString(36).slice(2, 8)}`,
        email,
        status,
        subtotalAmount: 990,
        totalAmount: 990,
        idempotencyKey: crypto.randomUUID(),
      })
      .returning()
  )[0]!

describe('admin: orders', () => {
  it('moves a paid order through fulfilment with a shipment and audit trail', async () => {
    const o = await mkOrder('paid')
    await updateOrder(db, actor, o.id, { status: 'fulfilled' })
    await updateOrder(db, actor, o.id, {
      status: 'shipped',
      carrier: 'Correos',
      trackingReference: 'PK123',
    })
    await updateOrder(db, actor, o.id, { status: 'delivered' })
    expect((await db.select().from(orders))[0]!.status).toBe('delivered')
    const [s] = await db.select().from(shipments)
    expect(s).toMatchObject({ status: 'delivered', trackingReference: 'PK123' })
    expect(await db.select().from(adminAuditLogs)).toHaveLength(3)
  })

  it('refuses payment-driven or skipped transitions', async () => {
    const unpaid = await mkOrder('awaiting_payment')
    await expect(updateOrder(db, actor, unpaid.id, { status: 'shipped' })).rejects.toBeInstanceOf(
      AdminError,
    )
    const paid = await mkOrder('paid')
    await expect(updateOrder(db, actor, paid.id, { status: 'cancelled' })).rejects.toBeInstanceOf(
      AdminError,
    )
    await expect(updateOrder(db, actor, paid.id, { status: 'delivered' })).rejects.toBeInstanceOf(
      AdminError,
    )
    expect(await db.select().from(adminAuditLogs)).toHaveLength(0)
  })
})

describe('admin: catalogue and stock', () => {
  it('price changes are audited and drop a stale Stripe price id', async () => {
    const [v] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, 'ART-MAIL-SINGLE'))
    await db
      .update(productVariants)
      .set({ stripePriceId: 'price_old' })
      .where(eq(productVariants.id, v!.id))
    await updateVariant(db, actor, v!.id, { priceAmount: 1090 })
    const [after] = await db.select().from(productVariants).where(eq(productVariants.id, v!.id))
    expect(after).toMatchObject({ priceAmount: 1090, stripePriceId: null })
    const [log] = await db.select().from(adminAuditLogs)
    expect(log).toMatchObject({ action: 'variant.update', entityId: 'ART-MAIL-SINGLE' })
    expect(log!.changes).toEqual({ priceAmount: { from: 990, to: 1090 } })
  })

  it('stock total cannot drop below reserved + sold', async () => {
    const [v] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, 'ART-MAIL-SINGLE'))
    await reserveStock(db, { variantId: v!.id, quantity: 10, reference: 'r1', ttlMs: 60_000 })
    await expect(updateInventory(db, actor, v!.id, 9)).rejects.toMatchObject({ status: 409 })
    await updateInventory(db, actor, v!.id, 60)
    expect((await db.select().from(inventory))[0]!.quantityTotal).toBe(60)
  })
})

describe('admin: artworks', () => {
  it('updates facts and translations; width and height go together', async () => {
    await updateArtwork(db, actor, 'painting-001', {
      year: 2024,
      widthCm: 30,
      heightCm: 40,
      translations: { en: { title: 'Real Title' }, es: { title: 'Título real' } },
    })
    const list = await listArtworksAdmin(db)
    const a = list.find((x) => x.slug === 'painting-001')!
    expect(a).toMatchObject({ year: 2024, widthCm: 30, heightCm: 40 })
    expect(a.translations.es?.title).toBe('Título real')
    await expect(updateArtwork(db, actor, 'painting-002', { widthCm: 30 })).rejects.toMatchObject({
      status: 400,
    })
    const [tr] = await db
      .select()
      .from(artworkTranslations)
      .innerJoin(artworks, eq(artworks.id, artworkTranslations.artworkId))
      .where(eq(artworks.slug, 'painting-001'))
    expect(tr).toBeTruthy()
  })
})

describe('account overview (customer area)', () => {
  it('shows only the user’s own PAID orders, matched by verified email', async () => {
    await mkOrder('paid', 'Buyer@Example.com')
    await mkOrder('awaiting_payment', 'buyer@example.com')
    await mkOrder('paid', 'someone-else@example.com')
    const mine = await accountOverview(db, {
      id: actor,
      email: 'buyer@example.com',
      emailVerified: true,
    })
    expect(mine.orders).toHaveLength(1)
    // An unverified email must not unlock orders placed with that address.
    const unverified = await accountOverview(db, {
      id: actor,
      email: 'buyer@example.com',
      emailVerified: false,
    })
    expect(unverified.orders).toHaveLength(0)
  })

  it('exposes the Stripe customer only for the user’s own customer record', async () => {
    await db.insert(customers).values({ email: 'buyer@example.com', stripeCustomerId: 'cus_mine' })
    await db.insert(customers).values({ email: 'other@example.com', stripeCustomerId: 'cus_other' })
    const r = await accountOverview(db, {
      id: actor,
      email: 'buyer@example.com',
      emailVerified: true,
    })
    expect(r.stripeCustomerId).toBe('cus_mine')
  })
})

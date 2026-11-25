import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDatabase } from '../../server/database/seed'
import {
  artists,
  artworks,
  orderItems,
  orders,
  productVariants,
  products,
  users,
} from '../../server/database/schema'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

let db: Database
let close: () => Promise<void>
let artistId: string

beforeAll(async () => {
  ;({ db, close } = await createTestDatabase())
  await seedDatabase(db)
  artistId = (await db.select().from(artists))[0]!.id
})
afterAll(() => close())

const rejects = (p: Promise<unknown>) => expect(p).rejects.toThrow()

describe('database integrity', () => {
  it('rejects duplicate emails case-insensitively', async () => {
    await db.insert(users).values({ name: 'A', email: 'Person@Example.com' })
    await rejects(db.insert(users).values({ name: 'B', email: 'person@example.com' }))
  })

  it('rejects impossible artwork data', async () => {
    await rejects(
      db.insert(artworks).values({ artistId, slug: 'bad-year', status: 'sold', year: 1200 }),
    )
    await rejects(
      db.insert(artworks).values({ artistId, slug: 'half-dims', status: 'sold', widthCm: 50 }),
    )
    await rejects(
      db
        .insert(artworks)
        .values({ artistId, slug: 'neg', status: 'sold', widthCm: -1, heightCm: 2 }),
    )
  })

  it('an original product must reference an artwork', async () => {
    await rejects(db.insert(products).values({ slug: 'orphan-original', type: 'original' }))
  })

  it('rejects negative prices and invalid currencies', async () => {
    const [p] = await db.insert(products).values({ slug: 'print-x', type: 'print' }).returning()
    await rejects(
      db
        .insert(productVariants)
        .values({ productId: p!.id, sku: 'NEG', name: 'x', priceAmount: -1 }),
    )
    await rejects(
      db
        .insert(productVariants)
        .values({ productId: p!.id, sku: 'CUR', name: 'x', priceAmount: 100, currency: 'eur' }),
    )
  })

  it('order totals must add up and idempotency keys are unique', async () => {
    await rejects(
      db.insert(orders).values({
        number: 'ST-1',
        email: 'a@b.co',
        subtotalAmount: 1000,
        shippingAmount: 300,
        totalAmount: 999,
        idempotencyKey: 'k1',
      }),
    )
    const [o] = await db
      .insert(orders)
      .values({
        number: 'ST-2',
        email: 'a@b.co',
        subtotalAmount: 1000,
        shippingAmount: 300,
        totalAmount: 1300,
        idempotencyKey: 'k2',
      })
      .returning()
    await rejects(
      db.insert(orders).values({
        number: 'ST-3',
        email: 'a@b.co',
        subtotalAmount: 1,
        totalAmount: 1,
        idempotencyKey: 'k2',
      }),
    )
    const [v] = await db.select().from(productVariants).limit(1)
    await rejects(
      db.insert(orderItems).values({
        orderId: o!.id,
        variantId: v!.id,
        titleSnapshot: 'x',
        quantity: 2,
        unitAmount: 500,
        totalAmount: 999,
      }),
    )
  })
})

import { randomUUID } from 'node:crypto'
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { canSetManually, type OrderStatus } from '../../shared/domain/order-status'
import type {
  ArtworkCreate,
  ArtworkUpdate,
  ImageAlt,
  OrderUpdate,
} from '../../shared/schemas/admin'
import type { Database } from '../database/client'
import {
  adminAuditLogs,
  artists,
  artworks,
  artworkTranslations,
  customers,
  inventory,
  orderItems,
  orders,
  payments,
  products,
  productVariants,
  shipments,
  subscriptions,
} from '../database/schema'
import { diff, writeAudit } from '../utils/audit'

export class AdminError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message)
  }
}

export async function adminSummary(db: Database) {
  const byStatus = await db
    .select({ status: orders.status, n: count() })
    .from(orders)
    .groupBy(orders.status)
  const [subs] = await db
    .select({ n: count() })
    .from(subscriptions)
    .where(inArray(subscriptions.status, ['active', 'trialing', 'past_due']))
  const stock = await db
    .select({
      sku: productVariants.sku,
      total: inventory.quantityTotal,
      reserved: inventory.quantityReserved,
      sold: inventory.quantitySold,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
  return {
    orders: Object.fromEntries(byStatus.map((r) => [r.status, r.n])),
    activeSubscriptions: subs?.n ?? 0,
    stock,
  }
}

export async function listOrders(
  db: Database,
  q: { status?: OrderStatus; limit: number; offset: number },
) {
  return db
    .select({
      id: orders.id,
      number: orders.number,
      status: orders.status,
      email: orders.email,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(q.status ? eq(orders.status, q.status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(q.limit)
    .offset(q.offset)
}

export async function getOrder(db: Database, id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) throw new AdminError(404, 'Order not found')
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
  const pays = await db.select().from(payments).where(eq(payments.orderId, id))
  const ships = await db.select().from(shipments).where(eq(shipments.orderId, id))
  const history = await db
    .select()
    .from(adminAuditLogs)
    .where(and(eq(adminAuditLogs.entityType, 'order'), eq(adminAuditLogs.entityId, id)))
    .orderBy(desc(adminAuditLogs.id))
  return { order, items, payments: pays, shipments: ships, history }
}

/** Manual fulfilment step (never payment states). Audited. */
export async function updateOrder(db: Database, actorUserId: string, id: string, u: OrderUpdate) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id))
    if (!order) throw new AdminError(404, 'Order not found')
    if (!canSetManually(order.status, u.status)) {
      throw new AdminError(409, `Cannot change ${order.status} → ${u.status}`)
    }
    await tx
      .update(orders)
      .set({ status: u.status, updatedAt: new Date() })
      .where(eq(orders.id, id))
    if (u.status === 'shipped') {
      await tx.insert(shipments).values({
        orderId: id,
        status: 'shipped',
        carrier: u.carrier ?? null,
        trackingReference: u.trackingReference ?? null,
        shippedAt: new Date(),
      })
    }
    if (u.status === 'delivered') {
      await tx
        .update(shipments)
        .set({ status: 'delivered', deliveredAt: new Date(), updatedAt: new Date() })
        .where(eq(shipments.orderId, id))
    }
    await writeAudit(tx as unknown as Database, {
      actorUserId,
      action: 'order.status',
      entityType: 'order',
      entityId: id,
      changes: {
        status: { from: order.status, to: u.status },
        ...(u.trackingReference ? { trackingReference: u.trackingReference } : {}),
      },
    })
  })
}

export async function listCatalogue(db: Database) {
  return db
    .select({
      productId: products.id,
      productSlug: products.slug,
      type: products.type,
      productActive: products.active,
      variantId: productVariants.id,
      sku: productVariants.sku,
      name: productVariants.name,
      priceAmount: productVariants.priceAmount,
      currency: productVariants.currency,
      interval: productVariants.billingInterval,
      variantActive: productVariants.active,
      total: inventory.quantityTotal,
      reserved: inventory.quantityReserved,
      sold: inventory.quantitySold,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .orderBy(products.slug, productVariants.sku)
}

export async function updateVariant(
  db: Database,
  actorUserId: string,
  id: string,
  u: { priceAmount?: number; active?: boolean },
) {
  return db.transaction(async (tx) => {
    const [v] = await tx.select().from(productVariants).where(eq(productVariants.id, id))
    if (!v) throw new AdminError(404, 'Variant not found')
    const changes = diff(v, u)
    if (!Object.keys(changes).length) return
    await tx
      .update(productVariants)
      .set({
        ...u,
        // A fixed Stripe Price would no longer match a new amount.
        ...(u.priceAmount !== undefined && u.priceAmount !== v.priceAmount
          ? { stripePriceId: null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, id))
    await writeAudit(tx as unknown as Database, {
      actorUserId,
      action: 'variant.update',
      entityType: 'product_variant',
      entityId: v.sku,
      changes,
    })
  })
}

export async function updateProduct(
  db: Database,
  actorUserId: string,
  id: string,
  active: boolean,
) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(products).where(eq(products.id, id))
    if (!p) throw new AdminError(404, 'Product not found')
    if (p.active === active) return
    await tx.update(products).set({ active, updatedAt: new Date() }).where(eq(products.id, id))
    await writeAudit(tx as unknown as Database, {
      actorUserId,
      action: 'product.active',
      entityType: 'product',
      entityId: p.slug,
      changes: { active: { from: p.active, to: active } },
    })
  })
}

/** Total stock can never go below reserved + sold (DB CHECK as well). */
export async function updateInventory(
  db: Database,
  actorUserId: string,
  variantId: string,
  quantityTotal: number,
) {
  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(inventory).where(eq(inventory.variantId, variantId))
    if (!inv) throw new AdminError(404, 'Inventory not found')
    if (quantityTotal < inv.quantityReserved + inv.quantitySold) {
      throw new AdminError(409, 'Total cannot be lower than reserved + sold units')
    }
    await tx
      .update(inventory)
      .set({ quantityTotal, updatedAt: new Date() })
      .where(eq(inventory.variantId, variantId))
    await writeAudit(tx as unknown as Database, {
      actorUserId,
      action: 'inventory.total',
      entityType: 'inventory',
      entityId: variantId,
      changes: { quantityTotal: { from: inv.quantityTotal, to: quantityTotal } },
    })
  })
}

export async function listArtworksAdmin(db: Database) {
  const rows = await db.select().from(artworks).orderBy(artworks.sortOrder)
  const trs = rows.length
    ? await db
        .select()
        .from(artworkTranslations)
        .where(
          inArray(
            artworkTranslations.artworkId,
            rows.map((r) => r.id),
          ),
        )
    : []
  return rows.map((r) => ({
    ...r,
    translations: Object.fromEntries(
      trs
        .filter((t) => t.artworkId === r.id)
        .map((t) => [
          t.locale,
          { title: t.title, description: t.description, imageAlt: t.imageAlt },
        ]),
    ),
  }))
}

export async function updateArtwork(
  db: Database,
  actorUserId: string,
  slug: string,
  u: ArtworkUpdate,
) {
  return db.transaction(async (tx) => {
    const [a] = await tx.select().from(artworks).where(eq(artworks.slug, slug))
    if (!a) throw new AdminError(404, 'Artwork not found')
    const { translations, ...fields } = u
    const changes: Record<string, unknown> = diff(a as Record<string, unknown>, fields)
    const w = fields.widthCm !== undefined ? fields.widthCm : a.widthCm
    const h = fields.heightCm !== undefined ? fields.heightCm : a.heightCm
    if ((w === null) !== (h === null)) {
      throw new AdminError(400, 'Width and height must be set together')
    }
    if (Object.keys(fields).length) {
      await tx
        .update(artworks)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(artworks.id, a.id))
    }
    for (const [locale, tr] of Object.entries(translations ?? {})) {
      const values = Object.fromEntries(Object.entries(tr).filter(([, v]) => v !== undefined))
      if (!Object.keys(values).length) continue
      await tx
        .insert(artworkTranslations)
        .values({ artworkId: a.id, locale: locale as 'en' | 'es' | 'ca', ...values })
        .onDuplicateKeyUpdate({ set: values })
      changes[`translations.${locale}`] = values
    }
    if (Object.keys(changes).length) {
      await writeAudit(tx as unknown as Database, {
        actorUserId,
        action: 'artwork.update',
        entityType: 'artwork',
        entityId: slug,
        changes,
      })
    }
  })
}

/** Create a new artwork (appended at the end of the list). Audited. */
export async function createArtwork(db: Database, actorUserId: string, input: ArtworkCreate) {
  return db.transaction(async (tx) => {
    const [exists] = await tx
      .select({ id: artworks.id })
      .from(artworks)
      .where(eq(artworks.slug, input.slug))
    if (exists) throw new AdminError(409, 'An artwork with this slug already exists')
    if ((input.widthCm == null) !== (input.heightCm == null)) {
      throw new AdminError(400, 'Width and height must be set together')
    }
    const [artist] = await tx.select().from(artists).where(eq(artists.slug, 'sergi-tugas'))
    if (!artist) throw new AdminError(409, 'Artist record missing (run the seed)')
    const [{ max } = { max: -1 }] = await tx
      .select({ max: sql<number>`coalesce(max(${artworks.sortOrder}), -1)` })
      .from(artworks)
    const { translations, ...fields } = input
    const id = randomUUID()
    await tx.insert(artworks).values({
      id,
      artistId: artist.id,
      slug: fields.slug,
      status: fields.status,
      featured: fields.featured ?? false,
      sortOrder: fields.sortOrder ?? Number(max) + 1,
      year: fields.year ?? null,
      medium: fields.medium ?? null,
      widthCm: fields.widthCm ?? null,
      heightCm: fields.heightCm ?? null,
      depthCm: fields.depthCm ?? null,
    })
    const [row] = await tx.select().from(artworks).where(eq(artworks.id, id))
    for (const [locale, tr] of Object.entries(translations ?? {})) {
      await tx.insert(artworkTranslations).values({
        artworkId: row!.id,
        locale: locale as 'en' | 'es' | 'ca',
        title: tr.title ?? null,
        description: tr.description ?? null,
        imageAlt: tr.imageAlt ?? null,
      })
    }
    await writeAudit(tx as unknown as Database, {
      actorUserId,
      action: 'artwork.create',
      entityType: 'artwork',
      entityId: input.slug,
      changes: { ...fields, translations },
    })
    return row!
  })
}

/** Attach a processed photo (and its alt text per locale) to an artwork. Audited. */
export async function setArtworkImage(
  db: Database,
  actorUserId: string,
  slug: string,
  image: { src: string; srcset: string; width: number; height: number },
  alt: ImageAlt,
) {
  return db.transaction(async (tx) => {
    const [a] = await tx.select().from(artworks).where(eq(artworks.slug, slug))
    if (!a) throw new AdminError(404, 'Artwork not found')
    await tx.update(artworks).set({ image, updatedAt: new Date() }).where(eq(artworks.id, a.id))
    for (const [locale, text] of Object.entries(alt)) {
      if (!text) continue
      await tx
        .insert(artworkTranslations)
        .values({ artworkId: a.id, locale: locale as 'en' | 'es' | 'ca', imageAlt: text })
        .onDuplicateKeyUpdate({ set: { imageAlt: text } })
    }
    await writeAudit(tx as unknown as Database, {
      actorUserId,
      action: 'artwork.image',
      entityType: 'artwork',
      entityId: slug,
      changes: { image: { from: a.image?.src ?? null, to: image.src } },
    })
  })
}

export async function listSubscriptionsAdmin(db: Database) {
  return db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      email: customers.email,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      isGift: subscriptions.isGift,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(customers, eq(customers.id, subscriptions.customerId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(200)
}

export async function listCustomersAdmin(db: Database) {
  return db
    .select({
      id: customers.id,
      email: customers.email,
      name: customers.name,
      createdAt: customers.createdAt,
      orders: sql<number>`(select count(*) from ${orders} where ${orders.customerId} = ${customers.id})`,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt))
    .limit(200)
}

export async function listAudit(db: Database) {
  return db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.id)).limit(200)
}

/** Customer-facing: orders + subscriptions for a signed-in, verified user. */
export async function accountOverview(
  db: Database,
  user: { id: string; email: string; emailVerified: boolean },
) {
  const ownedCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      user.emailVerified
        ? sql`${customers.userId} = ${user.id} OR lower(${customers.email}) = lower(${user.email})`
        : eq(customers.userId, user.id),
    )
  const ids = ownedCustomers.map((c) => c.id)
  const emailMatch = user.emailVerified
    ? sql`lower(${orders.email}) = lower(${user.email})`
    : sql`false`
  const myOrders = await db
    .select({
      number: orders.number,
      status: orders.status,
      totalAmount: orders.totalAmount,
      currency: orders.currency,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, [
          'paid',
          'fulfilled',
          'shipped',
          'delivered',
          'refunded',
          'partially_refunded',
        ]),
        ids.length ? sql`(${inArray(orders.customerId, ids)} OR ${emailMatch})` : emailMatch,
      ),
    )
    .orderBy(desc(orders.createdAt))
  const mySubs = ids.length
    ? await db
        .select({
          status: subscriptions.status,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        })
        .from(subscriptions)
        .where(inArray(subscriptions.customerId, ids))
    : []
  const [withStripe] = ids.length
    ? await db
        .select({ stripeCustomerId: customers.stripeCustomerId })
        .from(customers)
        .where(and(inArray(customers.id, ids), sql`${customers.stripeCustomerId} is not null`))
        .limit(1)
    : []
  return {
    orders: myOrders,
    subscriptions: mySubs,
    stripeCustomerId: withStripe?.stripeCustomerId ?? null,
  }
}

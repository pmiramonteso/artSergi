import { and, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { canSetManually, type OrderStatus } from '../../shared/domain/order-status'
import type { ArtworkUpdate, OrderUpdate } from '../../shared/schemas/admin'
import type { Database } from '../database/client'
import {
  adminAuditLogs,
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
  return { order, items, payments: pays, shipments: ships }
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
        .onConflictDoUpdate({
          target: [artworkTranslations.artworkId, artworkTranslations.locale],
          set: values,
        })
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

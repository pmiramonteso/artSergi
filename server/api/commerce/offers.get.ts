import { and, eq, inArray, sql } from 'drizzle-orm'
import { localeQuerySchema } from '#shared/schemas/content'
import type { PublicOffer } from '#shared/schemas/checkout'
import { isSellable } from '#shared/domain/commerce'
import { inventory, products, productTranslations, productVariants } from '../../database/schema'

/**
 * GET /api/commerce/offers?locale=en → purchasable Art Mail offers.
 * Empty list when commerce is disabled (the UI then shows "Notify me").
 */
export default defineEventHandler(async (event): Promise<{ mode: string; data: PublicOffer[] }> => {
  const state = commerceState(event)
  const db = useDatabase()
  setResponseHeader(event, 'Cache-Control', 'no-store')
  if (!state.enabled || !db) return { mode: 'off', data: [] }

  const q = await getValidatedQuery(event, (x) => localeQuerySchema.safeParse(x))
  const locale = (q.success ? q.data.locale : 'en') as 'en' | 'es' | 'ca'

  const rows = await db
    .select({
      sku: productVariants.sku,
      name: productVariants.name,
      amount: productVariants.priceAmount,
      currency: productVariants.currency,
      interval: productVariants.billingInterval,
      productActive: products.active,
      variantActive: productVariants.active,
      productId: products.id,
      available: sql<
        number | null
      >`${inventory.quantityTotal} - ${inventory.quantityReserved} - ${inventory.quantitySold}`,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(inArray(products.type, ['art_mail_single', 'art_mail_subscription', 'art_mail_gift']))
    .orderBy(productVariants.priceAmount)

  const titles = rows.length
    ? await db
        .select()
        .from(productTranslations)
        .where(
          and(
            inArray(
              productTranslations.productId,
              rows.map((r) => r.productId),
            ),
            eq(productTranslations.locale, locale),
          ),
        )
    : []

  const data = rows
    .filter((r) => isSellable(state.mode, r))
    .map((r) => ({
      sku: r.sku,
      title: titles.find((t) => t.productId === r.productId)?.title ?? r.name,
      amount: r.amount,
      currency: r.currency,
      interval: r.interval,
      available: r.available === null ? null : Number(r.available),
    }))
  return { mode: state.mode, data }
})

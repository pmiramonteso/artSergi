import { z } from 'zod'

const ORDER_STATUSES = [
  'pending',
  'awaiting_payment',
  'paid',
  'fulfilled',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded',
] as const

export const uuidParam = z.object({ id: z.uuid() })

export const listQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
})

export const orderUpdateSchema = z.strictObject({
  status: z.enum(['cancelled', 'fulfilled', 'shipped', 'delivered']),
  carrier: z.string().trim().min(1).max(80).optional(),
  trackingReference: z.string().trim().min(1).max(120).optional(),
})

export const variantUpdateSchema = z
  .strictObject({
    priceAmount: z.number().int().min(0).max(10_000_000).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.priceAmount !== undefined || v.active !== undefined, 'Nothing to update')

export const productUpdateSchema = z.strictObject({ active: z.boolean() })

export const inventoryUpdateSchema = z.strictObject({
  quantityTotal: z.number().int().min(0).max(100_000),
})

const text = (max: number) => z.string().trim().max(max).nullable().optional()

export const artworkUpdateSchema = z.strictObject({
  status: z.enum(['available', 'sold', 'archived']).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  year: z.number().int().min(1900).max(2200).nullable().optional(),
  medium: text(200),
  widthCm: z.number().positive().max(10_000).nullable().optional(),
  heightCm: z.number().positive().max(10_000).nullable().optional(),
  depthCm: z.number().positive().max(10_000).nullable().optional(),
  translations: z
    .partialRecord(
      z.enum(['en', 'es', 'ca']),
      z.strictObject({ title: text(200), description: text(4000), imageAlt: text(600) }),
    )
    .optional(),
})

/** New artwork: a URL slug plus the same editable fields. */
export const artworkCreateSchema = artworkUpdateSchema.extend({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, digits and hyphens'),
  status: z.enum(['available', 'sold', 'archived']),
})

/** Alt text for an uploaded photo: English required, ES/CA recommended. */
export const imageAltSchema = z.strictObject({
  en: z.string().trim().min(10).max(600),
  es: z.string().trim().max(600).optional(),
  ca: z.string().trim().max(600).optional(),
})

export type ArtworkCreate = z.infer<typeof artworkCreateSchema>
export type ImageAlt = z.infer<typeof imageAltSchema>
export type OrderUpdate = z.infer<typeof orderUpdateSchema>
export type ArtworkUpdate = z.infer<typeof artworkUpdateSchema>

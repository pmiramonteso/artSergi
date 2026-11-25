import { z } from 'zod'
import { LOCALE_CODES } from '#shared/constants/i18n'
import { accountOverview } from '../../services/admin'

const body = z.strictObject({ locale: z.enum(LOCALE_CODES as [string, ...string[]]) })

/**
 * POST /api/account/billing-portal → Stripe Customer Portal URL, where the
 * customer manages payment methods, invoices and subscription cancellation.
 * Only for the signed-in user's own Stripe customer (verified email).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { stripe, db } = requireCommerce(event)
  const b = await readValidatedBody(event, (x) => body.safeParse(x))
  if (!b.success) throw createError({ statusCode: 400, statusMessage: 'Invalid data' })
  const { stripeCustomerId } = await accountOverview(db, user)
  if (!stripeCustomerId) throw createError({ statusCode: 404, statusMessage: 'No billing account' })
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${siteOrigin(event)}/${b.data.locale}/account`,
  })
  return { url: session.url }
})

import { accountOverview } from '../../services/admin'

/** GET /api/account/overview: the signed-in customer's own data only. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { stripeCustomerId, ...data } = await accountOverview(requireDatabase(), user)
  return {
    user: {
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      twoFactorEnabled: !!user.twoFactorEnabled,
      isAdmin: hasRole(user, 'admin'),
    },
    canManageBilling: !!stripeCustomerId && commerceState(event).enabled,
    ...data,
  }
})

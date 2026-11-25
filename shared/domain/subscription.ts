/**
 * Subscription lifecycle rules (statuses mirror Stripe). Pure functions so
 * the webhook handler (Phase 8) and the UI agree on what a status means.
 * A subscription is only ever activated from a verified webhook.
 */
export const SUBSCRIPTION_STATUSES = [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
] as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

const TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  incomplete: ['active', 'trialing', 'incomplete_expired', 'canceled'],
  incomplete_expired: [],
  trialing: ['active', 'past_due', 'canceled', 'paused', 'unpaid'],
  active: ['past_due', 'canceled', 'unpaid', 'paused'],
  past_due: ['active', 'canceled', 'unpaid'],
  unpaid: ['active', 'canceled'],
  paused: ['active', 'canceled'],
  canceled: [],
}

export function canTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to)
}

/** Terminal statuses never change again (a new subscription is created instead). */
export function isTerminal(status: SubscriptionStatus): boolean {
  return TRANSITIONS[status].length === 0
}

/**
 * Whether the customer should receive the next shipment. `past_due` keeps
 * entitlement during Stripe's retry window; the business can tighten this.
 */
export function isEntitled(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due'
}

/**
 * Webhooks can arrive out of order. Apply an incoming status only if the
 * transition is valid; otherwise keep the current one and let the next
 * event (or a reconciliation job) converge.
 */
export function applyStatus(
  current: SubscriptionStatus,
  incoming: SubscriptionStatus,
): SubscriptionStatus {
  return canTransition(current, incoming) ? incoming : current
}

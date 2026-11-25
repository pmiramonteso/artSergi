/**
 * Manual (admin) order status transitions. Payment-driven states (paid,
 * refunded, partially_refunded) are set ONLY by verified Stripe webhooks;
 * staff can move a paid order through fulfilment or cancel an unpaid one.
 */
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'fulfilled'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

const MANUAL: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['cancelled'],
  awaiting_payment: ['cancelled'],
  paid: ['fulfilled'],
  fulfilled: ['shipped'],
  shipped: ['delivered'],
}

export function canSetManually(from: OrderStatus, to: OrderStatus): boolean {
  return MANUAL[from]?.includes(to) ?? false
}

export function manualTargets(from: OrderStatus): OrderStatus[] {
  return MANUAL[from] ?? []
}

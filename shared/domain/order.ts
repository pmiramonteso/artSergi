/**
 * Order arithmetic in integer minor units (cents). Prices always come from
 * the server catalogue; these helpers never accept a total from a client.
 */
export interface PricedLine {
  unitAmount: number
  quantity: number
}

function assertCents(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer amount in cents`)
  }
}

export function lineTotal({ unitAmount, quantity }: PricedLine): number {
  assertCents(unitAmount, 'unitAmount')
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Invalid quantity')
  return unitAmount * quantity
}

export function computeOrderTotals(
  lines: PricedLine[],
  opts: { shippingAmount?: number; taxAmount?: number } = {},
) {
  if (!lines.length) throw new Error('An order needs at least one line')
  const shippingAmount = opts.shippingAmount ?? 0
  const taxAmount = opts.taxAmount ?? 0
  assertCents(shippingAmount, 'shippingAmount')
  assertCents(taxAmount, 'taxAmount')
  const subtotalAmount = lines.reduce((sum, l) => sum + lineTotal(l), 0)
  return {
    subtotalAmount,
    shippingAmount,
    taxAmount,
    totalAmount: subtotalAmount + shippingAmount + taxAmount,
  }
}

/** Human-friendly order number, e.g. "ST-20261125-4F7K2Q". Not a secret. */
export function generateOrderNumber(
  now = new Date(),
  random = crypto.getRandomValues.bind(crypto),
) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // no 0/O/1/I
  const bytes = random(new Uint8Array(6))
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  return `ST-${date}-${suffix}`
}

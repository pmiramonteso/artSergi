<script setup lang="ts">
/** Readable order sheet for staff: customer, items, totals, address, payments, shipments, history. */
import { formatPrice } from '#shared/constants/products'
import { manualTargets, type OrderStatus } from '#shared/domain/order-status'

interface Detail {
  order: {
    id: string
    number: string
    status: OrderStatus
    email: string
    locale: string
    currency: string
    subtotalAmount: number
    shippingAmount: number
    taxAmount: number
    totalAmount: number
    createdAt: string
    updatedAt: string
    stripePaymentIntentId: string | null
    stripeCheckoutSessionId: string | null
    shippingAddress: {
      name: string
      line1: string
      line2?: string | null
      city: string
      postalCode: string
      region?: string | null
      country: string
    } | null
  }
  items: Array<{
    id: string
    titleSnapshot: string
    quantity: number
    unitAmount: number
    totalAmount: number
  }>
  payments: Array<{
    id: string
    providerPaymentId: string
    status: string
    amount: number
    refundedAmount: number
  }>
  shipments: Array<{
    id: string
    status: string
    carrier: string | null
    trackingReference: string | null
    shippedAt: string | null
    deliveredAt: string | null
  }>
  history: Array<{
    id: number
    action: string
    changes: Record<string, unknown> | null
    createdAt: string
  }>
}

const props = defineProps<{ detail: Detail }>()
const emit = defineEmits<{
  setStatus: [status: OrderStatus, extra: { carrier?: string; trackingReference?: string }]
}>()

const { public: config } = useRuntimeConfig()
const o = computed(() => props.detail.order)
const money = (cents: number) => formatPrice(cents, (o.value.currency as 'EUR') ?? 'EUR', 'en')
const when = (d: string | null) => (d ? new Date(d).toLocaleString('en-GB') : '—')
const stripeUrl = (pi: string) =>
  `https://dashboard.stripe.com/${config.commerceMode === 'live' ? '' : 'test/'}payments/${pi}`

const tracking = reactive({ carrier: '', trackingReference: '' })
const targets = computed(() => manualTargets(o.value.status))
function act(status: OrderStatus) {
  emit(
    'setStatus',
    status,
    status === 'shipped'
      ? {
          ...(tracking.carrier ? { carrier: tracking.carrier } : {}),
          ...(tracking.trackingReference ? { trackingReference: tracking.trackingReference } : {}),
        }
      : {},
  )
}
const box = 'bg-paper p-4 shadow-paper'
const h = 'mb-2 text-eyebrow opacity-70'
</script>

<template>
  <div class="grid gap-4 py-2 lg:grid-cols-3">
    <section :class="box">
      <h3 :class="h">Order</h3>
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt>Number</dt>
        <dd class="font-medium">{{ o.number }}</dd>
        <dt>Status</dt>
        <dd>
          <UiLabel>{{ o.status }}</UiLabel>
        </dd>
        <dt>Customer</dt>
        <dd>
          <a :href="`mailto:${o.email}`" class="underline">{{ o.email }}</a>
        </dd>
        <dt>Language</dt>
        <dd>{{ o.locale }}</dd>
        <dt>Created</dt>
        <dd>{{ when(o.createdAt) }}</dd>
        <dt>Updated</dt>
        <dd>{{ when(o.updatedAt) }}</dd>
      </dl>
    </section>

    <section :class="box">
      <h3 :class="h">Ship to</h3>
      <address v-if="o.shippingAddress" class="text-sm not-italic">
        {{ o.shippingAddress.name }}<br />
        {{ o.shippingAddress.line1 }}<br />
        <template v-if="o.shippingAddress.line2">{{ o.shippingAddress.line2 }}<br /></template>
        {{ o.shippingAddress.postalCode }} {{ o.shippingAddress.city }}<br />
        <template v-if="o.shippingAddress.region">{{ o.shippingAddress.region }}<br /></template>
        {{ o.shippingAddress.country }}
      </address>
      <p v-else class="text-sm opacity-70">No address yet (unpaid or digital).</p>
    </section>

    <section :class="box">
      <h3 :class="h">Payment</h3>
      <ul v-if="detail.payments.length" class="flex flex-col gap-2 text-sm">
        <li v-for="p in detail.payments" :key="p.id">
          <UiLabel tone="blue">{{ p.status }}</UiLabel>
          {{ money(p.amount) }}
          <span v-if="p.refundedAmount"> · refunded {{ money(p.refundedAmount) }}</span>
          <br />
          <a
            v-if="p.providerPaymentId.startsWith('pi_')"
            :href="stripeUrl(p.providerPaymentId)"
            target="_blank"
            rel="noopener"
            class="underline"
          >
            Open in Stripe ↗
          </a>
        </li>
      </ul>
      <p v-else class="text-sm opacity-70">No payment recorded.</p>
      <p class="mt-2 text-xs opacity-70">
        Refunds are made in Stripe; this order updates automatically.
      </p>
    </section>

    <section :class="box" class="lg:col-span-2">
      <h3 :class="h">Items</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left">
            <th class="py-1">Product</th>
            <th class="py-1 text-right">Qty</th>
            <th class="py-1 text-right">Unit</th>
            <th class="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in detail.items" :key="i.id" class="border-t border-ink/10">
            <td class="py-1">{{ i.titleSnapshot }}</td>
            <td class="py-1 text-right">{{ i.quantity }}</td>
            <td class="py-1 text-right">{{ money(i.unitAmount) }}</td>
            <td class="py-1 text-right">{{ money(i.totalAmount) }}</td>
          </tr>
        </tbody>
        <tfoot class="border-t border-ink/30">
          <tr>
            <td colspan="3" class="py-1 text-right">Subtotal</td>
            <td class="py-1 text-right">{{ money(o.subtotalAmount) }}</td>
          </tr>
          <tr>
            <td colspan="3" class="py-1 text-right">Shipping</td>
            <td class="py-1 text-right">{{ money(o.shippingAmount) }}</td>
          </tr>
          <tr>
            <td colspan="3" class="py-1 text-right">Tax</td>
            <td class="py-1 text-right">{{ money(o.taxAmount) }}</td>
          </tr>
          <tr class="font-semibold">
            <td colspan="3" class="py-1 text-right">Total</td>
            <td class="py-1 text-right">{{ money(o.totalAmount) }}</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <section :class="box">
      <h3 :class="h">Shipping & history</h3>
      <ul class="flex flex-col gap-1 text-sm">
        <li v-for="s in detail.shipments" :key="s.id">
          {{ s.status }} · {{ s.carrier ?? '—' }} {{ s.trackingReference ?? '' }}
          <span class="opacity-70">({{ when(s.shippedAt) }})</span>
        </li>
        <li v-for="e in detail.history" :key="e.id" class="opacity-80">
          {{ when(e.createdAt) }} — {{ e.action }}
          <code class="text-xs">{{ JSON.stringify(e.changes) }}</code>
        </li>
        <li v-if="!detail.shipments.length && !detail.history.length" class="opacity-70">
          Nothing yet.
        </li>
      </ul>
    </section>

    <section
      v-if="targets.length"
      :class="box"
      class="flex flex-wrap items-end gap-3 lg:col-span-3"
    >
      <template v-if="o.status === 'fulfilled'">
        <UiInput id="ship-carrier" v-model="tracking.carrier" label="Carrier" />
        <UiInput
          id="ship-tracking"
          v-model="tracking.trackingReference"
          label="Tracking reference"
        />
      </template>
      <UiButton
        v-for="t in targets"
        :key="t"
        :variant="t === 'cancelled' ? 'secondary' : 'primary'"
        @click="act(t)"
      >
        Mark {{ t }}
      </UiButton>
    </section>
  </div>
</template>

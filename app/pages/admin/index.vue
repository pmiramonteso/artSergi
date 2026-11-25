<script setup lang="ts">
/**
 * Admin panel (English only, never indexed). Every request is authorized on
 * the server (admin role + 2FA); this page only renders what the API allows.
 */
import { formatPrice } from '#shared/constants/products'
import { manualTargets, type OrderStatus } from '#shared/domain/order-status'

useSeoMeta({ title: 'Admin', robots: 'noindex, nofollow' })

type Tab = 'overview' | 'orders' | 'catalogue' | 'artworks' | 'people' | 'audit'
const tab = ref<Tab>('overview')
const tabs: Array<[Tab, string]> = [
  ['overview', 'Overview'],
  ['orders', 'Orders'],
  ['catalogue', 'Catalogue & stock'],
  ['artworks', 'Artworks'],
  ['people', 'Customers & subscriptions'],
  ['audit', 'Audit log'],
]

const headers = useRequestHeaders(['cookie'])
const {
  data: summary,
  error,
  refresh: refreshSummary,
} = await useFetch('/api/admin/summary', { headers })
const denied = computed(() => {
  const e = error.value as { statusCode?: number; data?: { data?: { code?: string } } } | null
  if (!e) return null
  if (e.statusCode === 401) return 'signin'
  if (e.data?.data?.code === 'MFA_REQUIRED') return 'mfa'
  return 'forbidden'
})

const lazy = { headers, immediate: false } as const
const orders = useFetch('/api/admin/orders', { ...lazy, query: { limit: 100 } })
const catalogue = useFetch('/api/admin/catalogue', lazy)
const artworks = useFetch('/api/admin/artworks', lazy)
const customers = useFetch('/api/admin/customers', lazy)
const subscriptions = useFetch('/api/admin/subscriptions', lazy)
const audit = useFetch('/api/admin/audit', lazy)

watch(tab, (t) => {
  if (t === 'orders') orders.execute()
  if (t === 'catalogue') catalogue.execute()
  if (t === 'artworks') artworks.execute()
  if (t === 'people') {
    customers.execute()
    subscriptions.execute()
  }
  if (t === 'audit') audit.execute()
})

const message = ref('')
async function patch(url: string, body: Record<string, unknown>, after: () => unknown) {
  message.value = ''
  try {
    await $fetch(url, { method: 'PATCH', body })
    message.value = 'Saved.'
    await after()
    await refreshSummary()
  } catch (e: unknown) {
    message.value = `Error: ${(e as { statusMessage?: string }).statusMessage ?? 'failed'}`
  }
}

// Orders
const openOrder = ref<string | null>(null)
const orderDetail = ref<Record<string, unknown> | null>(null)
const tracking = reactive({ carrier: '', trackingReference: '' })
async function toggleOrder(id: string) {
  openOrder.value = openOrder.value === id ? null : id
  orderDetail.value = openOrder.value ? await $fetch(`/api/admin/orders/${id}`) : null
}
function setStatus(id: string, status: OrderStatus) {
  const extra =
    status === 'shipped'
      ? {
          ...(tracking.carrier ? { carrier: tracking.carrier } : {}),
          ...(tracking.trackingReference ? { trackingReference: tracking.trackingReference } : {}),
        }
      : {}
  return patch(`/api/admin/orders/${id}`, { status, ...extra }, async () => {
    await orders.refresh()
    if (openOrder.value) orderDetail.value = await $fetch(`/api/admin/orders/${openOrder.value}`)
  })
}

// Catalogue edits (euros in the form, cents in the API)
const priceInputs = reactive<Record<string, string>>({})
const stockInputs = reactive<Record<string, string>>({})
const eur = (cents: number) => formatPrice(cents, 'EUR', 'en')

// Artwork edits
type ArtworkRow = {
  slug: string
  status: string
  year: number | null
  medium: string | null
  widthCm: number | null
  heightCm: number | null
  translations: Record<string, { title: string | null; description: string | null }>
}
const editing = ref<string | null>(null)
const form = reactive({
  status: 'sold',
  year: '',
  medium: '',
  widthCm: '',
  heightCm: '',
  titleEn: '',
  titleEs: '',
  titleCa: '',
  descEn: '',
})
function edit(a: ArtworkRow) {
  editing.value = a.slug
  Object.assign(form, {
    status: a.status,
    year: a.year?.toString() ?? '',
    medium: a.medium ?? '',
    widthCm: a.widthCm?.toString() ?? '',
    heightCm: a.heightCm?.toString() ?? '',
    titleEn: a.translations.en?.title ?? '',
    titleEs: a.translations.es?.title ?? '',
    titleCa: a.translations.ca?.title ?? '',
    descEn: a.translations.en?.description ?? '',
  })
}
const num = (v: string) => (v.trim() === '' ? null : Number(v))
const str = (v: string) => (v.trim() === '' ? null : v.trim())
function saveArtwork() {
  return patch(
    `/api/admin/artworks/${editing.value}`,
    {
      status: form.status,
      year: num(form.year),
      medium: str(form.medium),
      widthCm: num(form.widthCm),
      heightCm: num(form.heightCm),
      translations: {
        en: { title: str(form.titleEn), description: str(form.descEn) },
        es: { title: str(form.titleEs) },
        ca: { title: str(form.titleCa) },
      },
    },
    () => artworks.refresh(),
  )
}

const cell = 'border-b border-ink/10 px-3 py-2 text-left align-top'
</script>

<template>
  <UiContainer class="flex flex-col gap-8 pt-28 pb-24">
    <h1 class="font-serif text-h2">Admin</h1>

    <div v-if="denied" role="alert" class="flex max-w-xl flex-col gap-4 bg-paper p-6 shadow-paper">
      <template v-if="denied === 'signin'">
        <p>Sign in with an admin account.</p>
        <UiButton href="/en/account/sign-in?redirect=/admin" class="self-start">Sign in</UiButton>
      </template>
      <template v-else-if="denied === 'mfa'">
        <p>Two-factor authentication is required for admin access. Turn it on first.</p>
        <UiButton href="/en/account/security" class="self-start">Security settings</UiButton>
      </template>
      <p v-else>You do not have access to this area.</p>
    </div>

    <template v-else-if="summary">
      <nav aria-label="Admin sections" class="flex flex-wrap gap-1 bg-paper p-1 shadow-paper">
        <button
          v-for="[key, label] in tabs"
          :key="key"
          type="button"
          class="px-3 py-1.5 text-sm"
          :class="tab === key ? 'bg-ink text-paper' : 'hover:bg-ink/10'"
          :aria-current="tab === key ? 'page' : undefined"
          @click="tab = key"
        >
          {{ label }}
        </button>
      </nav>
      <p role="status" aria-live="polite" class="min-h-6 text-sm">{{ message }}</p>

      <!-- Overview -->
      <section v-if="tab === 'overview'" class="grid gap-6 md:grid-cols-3">
        <div class="bg-paper p-6 shadow-paper">
          <h2 class="text-eyebrow">Orders by status</h2>
          <dl class="mt-3 grid grid-cols-2 gap-1 text-sm">
            <template v-for="(n, s) in summary.orders" :key="s">
              <dt>{{ s }}</dt>
              <dd class="text-right">{{ n }}</dd>
            </template>
          </dl>
        </div>
        <div class="bg-paper p-6 shadow-paper">
          <h2 class="text-eyebrow">Active subscriptions</h2>
          <p class="mt-3 font-serif text-h2">{{ summary.activeSubscriptions }}</p>
        </div>
        <div class="bg-paper p-6 shadow-paper">
          <h2 class="text-eyebrow">Stock</h2>
          <ul class="mt-3 text-sm">
            <li v-for="s in summary.stock" :key="s.sku">
              {{ s.sku }}: {{ s.total - s.reserved - s.sold }} available ({{ s.reserved }} reserved,
              {{ s.sold }} sold of {{ s.total }})
            </li>
          </ul>
        </div>
      </section>

      <!-- Orders -->
      <section v-if="tab === 'orders'" class="overflow-x-auto bg-paper shadow-paper">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th :class="cell">Order</th>
              <th :class="cell">Status</th>
              <th :class="cell">Email</th>
              <th :class="cell">Total</th>
              <th :class="cell">Created</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="o in orders.data.value ?? []" :key="o.id">
              <tr>
                <td :class="cell">
                  <button
                    type="button"
                    class="underline"
                    :aria-expanded="openOrder === o.id"
                    @click="toggleOrder(o.id)"
                  >
                    {{ o.number }}
                  </button>
                </td>
                <td :class="cell">{{ o.status }}</td>
                <td :class="cell">{{ o.email }}</td>
                <td :class="cell">{{ eur(o.totalAmount) }}</td>
                <td :class="cell">{{ new Date(o.createdAt).toLocaleString('en-GB') }}</td>
              </tr>
              <tr v-if="openOrder === o.id && orderDetail">
                <td :class="cell" colspan="5">
                  <pre class="max-h-64 overflow-auto bg-ink/5 p-3 text-xs">{{ orderDetail }}</pre>
                  <div class="mt-3 flex flex-wrap items-end gap-3">
                    <template v-if="o.status === 'fulfilled'">
                      <UiInput id="ship-carrier" v-model="tracking.carrier" label="Carrier" />
                      <UiInput
                        id="ship-tracking"
                        v-model="tracking.trackingReference"
                        label="Tracking reference"
                      />
                    </template>
                    <UiButton
                      v-for="target in manualTargets(o.status as OrderStatus)"
                      :key="target"
                      :variant="target === 'cancelled' ? 'secondary' : 'primary'"
                      @click="setStatus(o.id, target)"
                    >
                      Mark {{ target }}
                    </UiButton>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </section>

      <!-- Catalogue -->
      <section v-if="tab === 'catalogue'" class="flex flex-col gap-4">
        <p class="text-sm">
          Prices are in euros. Live sales additionally require validated pricing (PRICING_PUBLISHED)
          and live Stripe keys.
        </p>
        <div class="overflow-x-auto bg-paper shadow-paper">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th :class="cell">SKU</th>
                <th :class="cell">Price</th>
                <th :class="cell">For sale</th>
                <th :class="cell">Stock (total / reserved / sold)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in catalogue.data.value ?? []" :key="v.variantId">
                <td :class="cell">
                  {{ v.sku }}<br /><span class="opacity-70"
                    >{{ v.type }}{{ v.interval ? ` · per ${v.interval}` : '' }}</span
                  >
                </td>
                <td :class="cell">
                  <form
                    class="flex items-center gap-2"
                    @submit.prevent="
                      patch(
                        `/api/admin/variants/${v.variantId}`,
                        { priceAmount: Math.round(Number(priceInputs[v.variantId]) * 100) },
                        () => catalogue.refresh(),
                      )
                    "
                  >
                    <label :for="`p-${v.variantId}`" class="sr-only">Price for {{ v.sku }}</label>
                    <input
                      :id="`p-${v.variantId}`"
                      v-model="priceInputs[v.variantId]"
                      :placeholder="(v.priceAmount / 100).toFixed(2)"
                      inputmode="decimal"
                      class="w-24 border border-ink px-2 py-1"
                    />
                    <UiButton type="submit" variant="ghost">Save</UiButton>
                  </form>
                </td>
                <td :class="cell">
                  <label class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :checked="v.productActive && v.variantActive"
                      @change="
                        (e) => {
                          const on = (e.target as HTMLInputElement).checked
                          patch(`/api/admin/products/${v.productId}`, { active: on }, () =>
                            patch(`/api/admin/variants/${v.variantId}`, { active: on }, () =>
                              catalogue.refresh(),
                            ),
                          )
                        }
                      "
                    />
                    Active
                  </label>
                </td>
                <td :class="cell">
                  <form
                    v-if="v.total !== null"
                    class="flex items-center gap-2"
                    @submit.prevent="
                      patch(
                        `/api/admin/inventory/${v.variantId}`,
                        { quantityTotal: Number(stockInputs[v.variantId]) },
                        () => catalogue.refresh(),
                      )
                    "
                  >
                    <label :for="`s-${v.variantId}`" class="sr-only"
                      >Total stock for {{ v.sku }}</label
                    >
                    <input
                      :id="`s-${v.variantId}`"
                      v-model="stockInputs[v.variantId]"
                      :placeholder="String(v.total)"
                      inputmode="numeric"
                      class="w-20 border border-ink px-2 py-1"
                    />
                    <span>/ {{ v.reserved }} / {{ v.sold }}</span>
                    <UiButton type="submit" variant="ghost">Save</UiButton>
                  </form>
                  <span v-else class="opacity-70">Not stock-tracked</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Artworks -->
      <section v-if="tab === 'artworks'" class="flex flex-col gap-4">
        <ul class="flex flex-col gap-2">
          <li
            v-for="a in (artworks.data.value ?? []) as ArtworkRow[]"
            :key="a.slug"
            class="flex flex-wrap items-center justify-between gap-3 bg-paper p-4 shadow-paper"
          >
            <span>
              <strong>{{ a.slug }}</strong> · {{ a.translations.en?.title ?? 'title pending' }} ·
              {{ a.status }}
            </span>
            <UiButton variant="secondary" @click="edit(a)">Edit</UiButton>
          </li>
        </ul>
        <form
          v-if="editing"
          class="grid max-w-3xl gap-4 bg-paper p-6 shadow-paper md:grid-cols-2"
          @submit.prevent="saveArtwork"
        >
          <h2 class="text-h3 font-semibold md:col-span-2">Edit {{ editing }}</h2>
          <div class="flex flex-col gap-2">
            <label for="aw-status" class="text-eyebrow">Status</label>
            <select
              id="aw-status"
              v-model="form.status"
              class="min-h-12 border-[1.5px] border-ink bg-paper px-3"
            >
              <option value="available">available</option>
              <option value="sold">sold</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <UiInput id="aw-year" v-model="form.year" label="Year" inputmode="numeric" />
          <UiInput id="aw-medium" v-model="form.medium" label="Medium" />
          <UiInput id="aw-w" v-model="form.widthCm" label="Width (cm)" inputmode="numeric" />
          <UiInput id="aw-h" v-model="form.heightCm" label="Height (cm)" inputmode="numeric" />
          <UiInput id="aw-ten" v-model="form.titleEn" label="Title (EN)" />
          <UiInput id="aw-tes" v-model="form.titleEs" label="Title (ES)" />
          <UiInput id="aw-tca" v-model="form.titleCa" label="Title (CA)" />
          <div class="flex flex-col gap-2 md:col-span-2">
            <label for="aw-desc" class="text-eyebrow">Description (EN)</label>
            <textarea
              id="aw-desc"
              v-model="form.descEn"
              rows="4"
              class="border-[1.5px] border-ink bg-paper p-3"
            />
          </div>
          <div class="flex gap-3 md:col-span-2">
            <UiButton type="submit">Save</UiButton>
            <UiButton variant="ghost" @click="editing = null">Close</UiButton>
          </div>
        </form>
      </section>

      <!-- People -->
      <section v-if="tab === 'people'" class="grid gap-6 lg:grid-cols-2">
        <div class="overflow-x-auto bg-paper shadow-paper">
          <h2 class="p-3 text-eyebrow">Customers</h2>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="c in customers.data.value ?? []" :key="c.id">
                <td :class="cell">{{ c.email }}</td>
                <td :class="cell">{{ c.orders }} orders</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="overflow-x-auto bg-paper shadow-paper">
          <h2 class="p-3 text-eyebrow">Subscriptions</h2>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="s in subscriptions.data.value ?? []" :key="s.id">
                <td :class="cell">{{ s.email }}</td>
                <td :class="cell">
                  {{ s.status }}{{ s.cancelAtPeriodEnd ? ' (cancels at period end)' : '' }}
                </td>
                <td :class="cell">
                  {{
                    s.currentPeriodEnd
                      ? new Date(s.currentPeriodEnd).toLocaleDateString('en-GB')
                      : '—'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Audit -->
      <section v-if="tab === 'audit'" class="overflow-x-auto bg-paper shadow-paper">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th :class="cell">When</th>
              <th :class="cell">Action</th>
              <th :class="cell">Entity</th>
              <th :class="cell">Changes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in audit.data.value ?? []" :key="l.id">
              <td :class="cell">{{ new Date(l.createdAt).toLocaleString('en-GB') }}</td>
              <td :class="cell">{{ l.action }}</td>
              <td :class="cell">{{ l.entityType }} {{ l.entityId }}</td>
              <td :class="cell">
                <code class="text-xs">{{ JSON.stringify(l.changes) }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </UiContainer>
</template>

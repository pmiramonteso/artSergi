<script setup lang="ts">
/**
 * Artworks admin: list with thumbnails, create new works, edit facts and
 * translations, and upload a photo (processed server-side: metadata
 * stripped, web sizes generated). Alt text in English is required.
 */
const emit = defineEmits<{ message: [text: string] }>()

interface Row {
  slug: string
  status: 'available' | 'sold' | 'archived'
  featured: boolean
  sortOrder: number
  year: number | null
  medium: string | null
  widthCm: number | null
  heightCm: number | null
  image: { src: string; srcset?: string } | null
  translations: Record<
    string,
    { title: string | null; description: string | null; imageAlt: string | null }
  >
}

const headers = useRequestHeaders(['cookie'])
const { data: rows, refresh } = await useFetch<Row[]>('/api/admin/artworks', {
  headers,
  default: () => [],
})

const errorText = (e: unknown) =>
  `Error: ${(e as { statusMessage?: string; data?: { statusMessage?: string } }).data?.statusMessage ?? (e as { statusMessage?: string }).statusMessage ?? 'failed'}`

// ── Form state (shared by "new" and "edit") ──────────────────────────────
const mode = ref<'none' | 'new' | 'edit'>('none')
const editing = ref<string | null>(null)
const blank = () => ({
  slug: '',
  status: 'available' as Row['status'],
  featured: false,
  sortOrder: '',
  year: '',
  medium: '',
  widthCm: '',
  heightCm: '',
  titleEn: '',
  titleEs: '',
  titleCa: '',
  descEn: '',
  descEs: '',
  descCa: '',
})
const form = reactive(blank())

const num = (v: string) => (v.trim() === '' ? null : Number(v))
const str = (v: string) => (v.trim() === '' ? null : v.trim())
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

watch(
  () => form.titleEn,
  (t) => {
    if (mode.value === 'new' && !slugTouched.value) form.slug = slugify(t)
  },
)
const slugTouched = ref(false)

function startNew() {
  Object.assign(form, blank())
  slugTouched.value = false
  editing.value = null
  mode.value = 'new'
}
function startEdit(a: Row) {
  Object.assign(form, blank(), {
    slug: a.slug,
    status: a.status,
    featured: a.featured,
    sortOrder: String(a.sortOrder),
    year: a.year?.toString() ?? '',
    medium: a.medium ?? '',
    widthCm: a.widthCm?.toString() ?? '',
    heightCm: a.heightCm?.toString() ?? '',
    titleEn: a.translations.en?.title ?? '',
    titleEs: a.translations.es?.title ?? '',
    titleCa: a.translations.ca?.title ?? '',
    descEn: a.translations.en?.description ?? '',
    descEs: a.translations.es?.description ?? '',
    descCa: a.translations.ca?.description ?? '',
  })
  Object.assign(alt, {
    en: a.translations.en?.imageAlt ?? '',
    es: a.translations.es?.imageAlt ?? '',
    ca: a.translations.ca?.imageAlt ?? '',
  })
  editing.value = a.slug
  mode.value = 'edit'
}

function payload() {
  return {
    status: form.status,
    featured: form.featured,
    ...(form.sortOrder.trim() ? { sortOrder: Number(form.sortOrder) } : {}),
    year: num(form.year),
    medium: str(form.medium),
    widthCm: num(form.widthCm),
    heightCm: num(form.heightCm),
    translations: {
      en: { title: str(form.titleEn), description: str(form.descEn) },
      es: { title: str(form.titleEs), description: str(form.descEs) },
      ca: { title: str(form.titleCa), description: str(form.descCa) },
    },
  }
}

const busy = ref(false)
async function save() {
  busy.value = true
  try {
    if (mode.value === 'new') {
      await $fetch('/api/admin/artworks', {
        method: 'POST',
        body: { slug: form.slug, ...payload() },
      })
      emit('message', 'Artwork created. Now add its photo below.')
      await refresh()
      const created = rows.value.find((r) => r.slug === form.slug)
      if (created) startEdit(created)
    } else {
      await $fetch(`/api/admin/artworks/${editing.value}`, { method: 'PATCH', body: payload() })
      emit('message', 'Saved.')
      await refresh()
    }
  } catch (e) {
    emit('message', errorText(e))
  } finally {
    busy.value = false
  }
}

// ── Photo upload ──────────────────────────────────────────────────────────
const file = ref<File | null>(null)
const preview = ref<string | null>(null)
const alt = reactive({ en: '', es: '', ca: '' })
function pick(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  file.value = f
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = f ? URL.createObjectURL(f) : null
}
async function upload() {
  if (!file.value || !editing.value) return
  busy.value = true
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    fd.append('alt_en', alt.en)
    if (alt.es) fd.append('alt_es', alt.es)
    if (alt.ca) fd.append('alt_ca', alt.ca)
    await $fetch(`/api/admin/artworks/${editing.value}/image`, { method: 'POST', body: fd })
    emit('message', 'Photo uploaded and published.')
    file.value = null
    preview.value = null
    await refresh()
  } catch (e) {
    emit('message', errorText(e))
  } finally {
    busy.value = false
  }
}

const current = computed(() => rows.value.find((r) => r.slug === editing.value) ?? null)
const field = 'flex flex-col gap-2'
const input = 'min-h-11 border-[1.5px] border-ink bg-paper px-3'
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <p class="text-sm">
        {{ rows.length }} artworks. The first 3 marked “featured” appear in the hero.
      </p>
      <UiButton @click="startNew">+ New artwork</UiButton>
    </div>

    <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="a in rows" :key="a.slug" class="flex gap-3 bg-paper p-3 shadow-paper">
        <img
          v-if="a.image"
          :src="a.image.src"
          alt=""
          width="64"
          height="80"
          class="h-20 w-16 shrink-0 object-cover"
        />
        <div
          v-else
          class="flex h-20 w-16 shrink-0 items-center justify-center border border-dashed border-ink/40 text-[0.6rem]"
        >
          no photo
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <strong class="truncate">{{ a.translations.en?.title ?? a.slug }}</strong>
          <span class="opacity-70"
            >{{ a.slug }} · {{ a.status }}{{ a.featured ? ' · featured' : '' }}</span
          >
          <UiButton variant="ghost" class="self-start" @click="startEdit(a)">Edit</UiButton>
        </div>
      </li>
    </ul>

    <form
      v-if="mode !== 'none'"
      class="grid max-w-4xl gap-4 bg-paper p-6 shadow-paper md:grid-cols-2"
      @submit.prevent="save"
    >
      <h2 class="text-h3 font-semibold md:col-span-2">
        {{ mode === 'new' ? 'New artwork' : `Edit ${editing}` }}
      </h2>

      <UiInput id="aw-ten" v-model="form.titleEn" label="Title (EN)" />
      <div :class="field">
        <label for="aw-slug" class="text-eyebrow">URL slug</label>
        <input
          id="aw-slug"
          v-model="form.slug"
          :disabled="mode === 'edit'"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          :class="input"
          @input="slugTouched = true"
        />
        <p class="text-xs opacity-70">
          Appears in the address: /works/{{ form.slug || '…' }}. Can’t change later.
        </p>
      </div>
      <UiInput id="aw-tes" v-model="form.titleEs" label="Title (ES)" />
      <UiInput id="aw-tca" v-model="form.titleCa" label="Title (CA)" />

      <div :class="field">
        <label for="aw-status" class="text-eyebrow">Status</label>
        <select id="aw-status" v-model="form.status" :class="input">
          <option value="available">available</option>
          <option value="sold">sold</option>
          <option value="archived">archived</option>
        </select>
      </div>
      <label class="flex items-center gap-2 self-end pb-3 text-sm">
        <input v-model="form.featured" type="checkbox" class="size-5 accent-ink" /> Featured
        (homepage)
      </label>

      <UiInput id="aw-year" v-model="form.year" label="Year" inputmode="numeric" />
      <UiInput id="aw-medium" v-model="form.medium" label="Medium (e.g. Acrylic on canvas)" />
      <UiInput id="aw-w" v-model="form.widthCm" label="Width (cm)" inputmode="numeric" />
      <UiInput id="aw-h" v-model="form.heightCm" label="Height (cm)" inputmode="numeric" />
      <UiInput
        id="aw-order"
        v-model="form.sortOrder"
        label="Order (0 = first)"
        inputmode="numeric"
      />

      <div
        v-for="[l, label] in [
          ['En', 'EN'],
          ['Es', 'ES'],
          ['Ca', 'CA'],
        ] as const"
        :key="l"
        :class="field"
        class="md:col-span-2"
      >
        <label :for="`aw-desc-${l}`" class="text-eyebrow">Description ({{ label }})</label>
        <textarea
          :id="`aw-desc-${l}`"
          v-model="form[`desc${l}`]"
          rows="3"
          class="border-[1.5px] border-ink bg-paper p-3"
        />
      </div>

      <div class="flex gap-3 md:col-span-2">
        <UiButton type="submit" :disabled="busy">{{
          mode === 'new' ? 'Create artwork' : 'Save'
        }}</UiButton>
        <UiButton variant="ghost" @click="mode = 'none'">Close</UiButton>
      </div>
    </form>

    <section
      v-if="mode === 'edit' && current"
      class="grid max-w-4xl gap-4 bg-paper p-6 shadow-paper md:grid-cols-[12rem_1fr]"
    >
      <h2 class="text-h3 font-semibold md:col-span-2">Photo</h2>
      <div>
        <img v-if="preview" :src="preview" alt="New photo preview" class="w-full" />
        <img
          v-else-if="current.image"
          :src="current.image.src"
          alt="Current photo"
          class="w-full"
        />
        <p v-else class="text-sm opacity-70">No photo yet.</p>
      </div>
      <form class="flex flex-col gap-4" @submit.prevent="upload">
        <div :class="field">
          <label for="aw-file" class="text-eyebrow"
            >Photo (JPEG, PNG, WebP or TIFF, max 20 MB)</label
          >
          <input
            id="aw-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            required
            @change="pick"
          />
          <p class="text-xs opacity-70">
            Frontal, accurate colours, no reflections. Location and camera data are removed
            automatically.
          </p>
        </div>
        <div :class="field">
          <label for="aw-alt-en" class="text-eyebrow"
            >Description for screen readers (EN, required)</label
          >
          <textarea
            id="aw-alt-en"
            v-model="alt.en"
            rows="2"
            required
            minlength="10"
            class="border-[1.5px] border-ink bg-paper p-3"
          />
          <p class="text-xs opacity-70">
            Describe what is visible, e.g. “Painting of a red car carrying a tower of suitcases”.
          </p>
        </div>
        <UiInput id="aw-alt-es" v-model="alt.es" label="Description (ES)" />
        <UiInput id="aw-alt-ca" v-model="alt.ca" label="Description (CA)" />
        <UiButton type="submit" class="self-start" :disabled="busy || !file">Upload photo</UiButton>
      </form>
    </section>
  </section>
</template>

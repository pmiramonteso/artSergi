<script setup lang="ts">
/** Labelled input with optional hint/error wired via aria-describedby. */
const model = defineModel<string>({ required: true })
const props = defineProps<{
  id: string
  label: string
  type?: string
  autocomplete?: string
  hint?: string
  error?: string
  required?: boolean
  inputmode?: 'text' | 'email' | 'numeric'
  minlength?: number
}>()
const describedBy = computed(
  () =>
    [props.hint ? `${props.id}-hint` : '', props.error ? `${props.id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined,
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-eyebrow">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :required="required"
      :minlength="minlength"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="min-h-12 border-[1.5px] border-ink bg-paper px-4 text-body focus-visible:outline-offset-1"
    />
    <p v-if="hint" :id="`${id}-hint`" class="text-sm opacity-80">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="text-sm text-tomato-ink">{{ error }}</p>
  </div>
</template>

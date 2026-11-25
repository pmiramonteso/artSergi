<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * Button or link with the studio's visual language.
 * Pass `to` (internal) or `href` (external) to render a link; otherwise a <button>.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'md' | 'lg'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  { variant: 'primary', size: 'md', to: undefined, href: undefined, type: 'button' },
)

const NuxtLink = resolveComponent('NuxtLink')

const isLink = computed(() => props.to !== undefined || props.href !== undefined)

const variantClass = {
  primary: 'bg-ink text-paper hover:bg-electric-blue',
  secondary: 'border-ink text-ink border-[1.5px] hover:bg-ink hover:text-paper',
  ghost: 'text-ink underline decoration-1 underline-offset-[6px] hover:decoration-2',
} as const

const sizeClass = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-7 text-base',
} as const
</script>

<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    :to="isLink ? (to ?? href) : undefined"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : disabled"
    :aria-disabled="isLink && disabled ? 'true' : undefined"
    class="inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors duration-(--duration-base) ease-(--ease-out) disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variantClass[variant], variant === 'ghost' ? 'px-0' : sizeClass[size]]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import type { NewsletterResult } from '#shared/schemas/newsletter'

/**
 * 07 · Newsletter. The server is the authority (Zod validation, rate limit,
 * honeypot, timing check). The browser only does light checks for fast,
 * accessible feedback, so Zod never ships to the client.
 */
type Status = 'idle' | 'submitting' | 'success' | 'unavailable' | 'error'

const email = ref('')
const consent = ref(false)
const website = ref('') // honeypot
const status = ref<Status>('idle')
const message = ref('')
const errors = reactive<{ email?: string; consent?: string }>({})
const renderedAt = ref(0)

onMounted(() => (renderedAt.value = Date.now()))

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  errors.email = EMAIL_PATTERN.test(email.value.trim())
    ? undefined
    : 'Enter a valid email address, like name@example.com.'
  errors.consent = consent.value ? undefined : 'Please confirm you agree to receive the newsletter.'
  return !errors.email && !errors.consent
}

const emailInput = ref<HTMLInputElement | null>(null)
const consentInput = ref<HTMLInputElement | null>(null)

async function submit() {
  if (status.value === 'submitting') return
  if (!validate()) {
    ;(errors.email ? emailInput : consentInput).value?.focus()
    return
  }
  status.value = 'submitting'
  try {
    await $fetch<NewsletterResult>('/api/newsletter', {
      method: 'POST',
      body: {
        email: email.value,
        consent: consent.value,
        locale: 'en',
        website: website.value,
        elapsedMs: Math.max(0, Date.now() - renderedAt.value),
      },
    })
    status.value = 'success'
    message.value = 'Thank you, you’re on the list.'
  } catch (err: unknown) {
    const e = err as { statusCode?: number; data?: Partial<NewsletterResult> }
    if (e.statusCode === 503 && e.data && 'message' in e.data) {
      status.value = 'unavailable'
      message.value = 'Sign-up opens soon. Your email was not stored, so please come back later.'
    } else if (e.statusCode === 429) {
      status.value = 'error'
      message.value = 'Too many attempts. Please wait a few minutes and try again.'
    } else {
      status.value = 'error'
      message.value = 'Something went wrong. Please check your details and try again.'
    }
  }
}
</script>

<template>
  <section
    id="newsletter"
    data-canvas-scene="newsletter"
    aria-labelledby="newsletter-title"
    class="flex min-h-[85svh] scroll-mt-16 items-center py-(--spacing-section)"
  >
    <UiContainer class="grid gap-10 md:grid-cols-12">
      <div data-reveal class="flex flex-col gap-4 md:col-span-5">
        <UiSectionHeading number="07" eyebrow="Newsletter" title="Letters from the studio">
          New collections, original works and the Art Mail Club launch, first.
        </UiSectionHeading>
      </div>

      <div data-reveal class="bg-paper p-6 shadow-paper md:col-span-6 md:col-start-7 md:p-8">
        <form novalidate class="flex flex-col gap-6" @submit.prevent="submit">
          <div class="flex flex-col gap-2">
            <label for="nl-email" class="text-eyebrow">Email</label>
            <input
              id="nl-email"
              ref="emailInput"
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              inputmode="email"
              required
              :aria-invalid="errors.email ? 'true' : undefined"
              :aria-describedby="errors.email ? 'nl-email-error' : undefined"
              class="min-h-12 border-[1.5px] border-ink bg-paper px-4 text-body focus-visible:outline-offset-1"
            />
            <p v-if="errors.email" id="nl-email-error" class="text-sm text-tomato-ink">
              {{ errors.email }}
            </p>
          </div>

          <!-- Honeypot: hidden from people and assistive tech -->
          <div class="absolute -left-[9999px]" aria-hidden="true">
            <label for="nl-website">Website</label>
            <input
              id="nl-website"
              v-model="website"
              type="text"
              name="website"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-start gap-3">
              <input
                id="nl-consent"
                ref="consentInput"
                v-model="consent"
                type="checkbox"
                name="consent"
                required
                :aria-invalid="errors.consent ? 'true' : undefined"
                :aria-describedby="errors.consent ? 'nl-consent-error' : undefined"
                class="mt-1 size-5 shrink-0 accent-ink"
              />
              <label for="nl-consent" class="text-sm">
                I agree to receive occasional emails from Sergi Tugas Art Studio. I can unsubscribe
                at any time. See the
                <NuxtLink to="/legal/privacy" class="underline underline-offset-2">
                  privacy policy</NuxtLink
                >.
              </label>
            </div>
            <p v-if="errors.consent" id="nl-consent-error" class="text-sm text-tomato-ink">
              {{ errors.consent }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <UiButton type="submit" size="lg" :disabled="status === 'submitting'">
              {{ status === 'submitting' ? 'Sending…' : 'Subscribe' }}
            </UiButton>
          </div>

          <p
            role="status"
            aria-live="polite"
            class="min-h-6 text-sm"
            :class="{
              'text-electric-blue': status === 'success',
              'text-tomato-ink': status === 'error',
            }"
          >
            {{ message }}
          </p>
        </form>
      </div>
    </UiContainer>
  </section>
</template>

/**
 * Locales and localized paths, the single source for nuxt.config (i18n
 * routing), the sitemap and structured data.
 */
export const LOCALES = [
  { code: 'en', language: 'en', name: 'English', file: 'en.json' },
  { code: 'es', language: 'es', name: 'Español', file: 'es.json' },
  { code: 'ca', language: 'ca', name: 'Català', file: 'ca.json' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

export const LOCALE_CODES = LOCALES.map((l) => l.code) as LocaleCode[]

/** Primary visual language. Configurable here (see OPEN_QUESTIONS B10). */
export const DEFAULT_LOCALE: LocaleCode = 'en'

export type LocalizedText = Record<LocaleCode, string>

/**
 * Localized URL segments, keyed by Nuxt page name. `[slug]` parts stay
 * identical across languages. Pages not listed use their file path.
 */
export const LOCALIZED_PAGES = {
  works: { en: '/works', es: '/obras', ca: '/obres' },
  'works-slug': { en: '/works/[slug]', es: '/obras/[slug]', ca: '/obres/[slug]' },
} as const satisfies Record<string, LocalizedText>

/** Build the localized path for a page (without base URL). */
export function localizedPath(
  locale: LocaleCode,
  page: keyof typeof LOCALIZED_PAGES | 'index',
  params: Record<string, string> = {},
): string {
  const pattern = page === 'index' ? '' : LOCALIZED_PAGES[page][locale]
  const path = pattern.replace(/\[(\w+)\]/g, (_, key: string) => {
    const value = params[key]
    if (!value) throw new Error(`Missing route param "${key}"`)
    return encodeURIComponent(value)
  })
  return `/${locale}${path}`
}

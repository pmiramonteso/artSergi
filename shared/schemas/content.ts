import { z } from 'zod'
import { DEFAULT_LOCALE, LOCALE_CODES } from '../constants/i18n'

export const localeQuerySchema = z.object({
  locale: z.enum(LOCALE_CODES as [string, ...string[]]).default(DEFAULT_LOCALE),
})

/** URL slugs: lowercase letters, digits and single hyphens, max 80 chars. */
export const slugParamSchema = z.object({
  slug: z
    .string()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

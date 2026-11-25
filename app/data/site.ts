/**
 * Site-wide details shown in the footer. Empty values are hidden.
 * Fill them only with information confirmed by Sergi.
 */
export interface SocialLink {
  label: string
  href: string
}

export const siteContact = {
  /** Public contact email, e.g. 'hello@<domain>'. Empty until decided. */
  email: '',
}

/** Social profiles. Empty until the real handles are confirmed. */
export const socialLinks: SocialLink[] = []

export const legalPages = [
  { slug: 'privacy', label: 'Privacy' },
  { slug: 'cookies', label: 'Cookies' },
  { slug: 'terms', label: 'Terms' },
  { slug: 'shipping-returns', label: 'Shipping & returns' },
] as const

export type LegalSlug = (typeof legalPages)[number]['slug']

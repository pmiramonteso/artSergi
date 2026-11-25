/**
 * Main navigation. Labels are i18n keys. Until the dedicated pages exist,
 * items point to homepage sections (anchors) so no link leads to a 404.
 */
export interface NavItem {
  /** i18n key, e.g. 'nav.works' */
  key: string
  /** Section id on the homepage. */
  hash: string
}

export const mainNavigation: NavItem[] = [
  { key: 'nav.works', hash: 'works' },
  { key: 'nav.artMail', hash: 'art-mail' },
  { key: 'nav.collection', hash: 'collection' },
  { key: 'nav.studio', hash: 'process' },
  { key: 'nav.about', hash: 'intro' },
]

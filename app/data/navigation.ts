/**
 * Main navigation. Until the dedicated pages exist (Phase 5+), items point
 * to homepage sections so no link leads to a 404.
 */
export interface NavItem {
  label: string
  to: string
}

export const mainNavigation: NavItem[] = [
  { label: 'Works', to: '/#works' },
  { label: 'Art Mail Club', to: '/#art-mail' },
  { label: 'Collection', to: '/#collection' },
  { label: 'Studio', to: '/#process' },
  { label: 'About', to: '/#intro' },
]

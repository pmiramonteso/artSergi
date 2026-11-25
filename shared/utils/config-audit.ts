/**
 * Production configuration checks, run once at server start. Returns
 * human-readable issues WITHOUT secret values. 'fatal' issues stop the
 * server (unsafe to serve); 'warn' issues are logged.
 */
export interface ConfigIssue {
  level: 'fatal' | 'warn'
  message: string
}

export function auditConfig(c: {
  siteUrl: string
  siteIndexable: unknown
  databaseUrl: string
  authSecret: string
  smtpUrl: string
  commerceMode: unknown
  publicCommerceMode: unknown
  stripeSecretKey: string
  clientIpHeader: string
}): ConfigIssue[] {
  const issues: ConfigIssue[] = []
  const https = c.siteUrl.startsWith('https://')
  if (c.siteIndexable === true && !https) {
    issues.push({
      level: 'fatal',
      message: 'SITE_INDEXABLE=true requires an https NUXT_PUBLIC_SITE_URL',
    })
  }
  if (!c.siteUrl) issues.push({ level: 'warn', message: 'NUXT_PUBLIC_SITE_URL is not set' })
  if (c.authSecret && c.authSecret.length < 32) {
    issues.push({ level: 'fatal', message: 'NUXT_AUTH_SECRET must be at least 32 characters' })
  }
  if (c.authSecret && c.databaseUrl && !c.smtpUrl) {
    issues.push({ level: 'warn', message: 'Accounts are enabled but NUXT_SMTP_URL is not set' })
  }
  if (c.commerceMode !== c.publicCommerceMode) {
    issues.push({
      level: 'warn',
      message: 'NUXT_COMMERCE_MODE and NUXT_PUBLIC_COMMERCE_MODE differ',
    })
  }
  if (c.commerceMode === 'test' && c.siteIndexable === true) {
    issues.push({
      level: 'warn',
      message: 'Commerce is in TEST mode on an indexable (production) site',
    })
  }
  if (/^(sk|rk)_live_/.test(c.stripeSecretKey) && c.commerceMode !== 'live') {
    issues.push({
      level: 'warn',
      message: 'A LIVE Stripe key is configured outside live mode (ignored)',
    })
  }
  if (c.commerceMode !== 'off' && !c.databaseUrl) {
    issues.push({
      level: 'warn',
      message: 'Commerce is enabled but there is no database (checkout disabled)',
    })
  }
  if (https && !c.clientIpHeader) {
    issues.push({
      level: 'warn',
      message: 'Behind a proxy? Set NUXT_CLIENT_IP_HEADER so rate limits see real client IPs',
    })
  }
  return issues
}

import { auditConfig } from '#shared/utils/config-audit'

/** Log configuration issues at startup in production; stop on fatal ones. */
export default defineNitroPlugin(() => {
  if (import.meta.dev) return
  const c = useRuntimeConfig()
  const issues = auditConfig({
    siteUrl: String(c.public.siteUrl ?? ''),
    siteIndexable: c.public.siteIndexable,
    databaseUrl: String(c.databaseUrl ?? ''),
    authSecret: String(c.authSecret ?? ''),
    smtpUrl: String(c.smtpUrl ?? ''),
    commerceMode: c.commerceMode,
    publicCommerceMode: c.public.commerceMode,
    stripeSecretKey: String(c.stripeSecretKey ?? ''),
    clientIpHeader: String(c.clientIpHeader ?? ''),
  })
  for (const i of issues)
    console.warn(JSON.stringify({ level: i.level, msg: `[config] ${i.message}` }))
  if (issues.some((i) => i.level === 'fatal')) process.exit(1)
})

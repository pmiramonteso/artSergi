/**
 * Liveness probe for hosting/uptime monitoring. Exposes no version,
 * environment or dependency information on purpose.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { status: 'ok' }
})

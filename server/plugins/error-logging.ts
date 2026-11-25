/**
 * Structured error log lines (JSON) for the hosting log viewer / a log
 * shipper. Deliberately minimal: no bodies, headers, cookies, query strings
 * or user data, only what is needed to find the failing route.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500
    if (status < 500) return
    console.error(
      JSON.stringify({
        level: 'error',
        time: new Date().toISOString(),
        status,
        method: event?.method,
        path: event?.path?.split('?')[0],
        message: String((error as Error).message).slice(0, 300),
      }),
    )
  })
})

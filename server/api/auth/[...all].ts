/**
 * All Better Auth endpoints (/api/auth/*).
 *
 * Sessions live in an HttpOnly cookie. Better Auth also echoes the session
 * token in some JSON bodies (e.g. sign-in, verify-totp); browser code never
 * needs it, so it is stripped here so it can't leak to client-side JS or
 * logs.
 */
export default defineEventHandler(async (event) => {
  const res = await requireAuth(event).handler(toWebRequest(event))
  if (!res.headers.get('content-type')?.includes('application/json')) return res

  const text = await res.text()
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return new Response(text, res)
  }
  if (body && typeof body === 'object' && 'token' in body) {
    delete (body as Record<string, unknown>).token
  }
  const headers = new Headers(res.headers)
  headers.delete('content-length')
  return new Response(JSON.stringify(body), { status: res.status, headers })
})

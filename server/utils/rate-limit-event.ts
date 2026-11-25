import type { H3Event } from 'h3'
import {
  createRateLimiter,
  hitDbRateLimit,
  type RateLimitResult,
  type RateLimiter,
} from './rate-limit'

const memory = new Map<string, RateLimiter>()

/**
 * Rate limit for an endpoint: database-backed (shared by every process)
 * when a database is configured, in-memory otherwise. Throws 429 with
 * Retry-After when exceeded.
 */
export async function hitRateLimit(
  event: H3Event,
  key: string,
  opts: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const db = useDatabase()
  let result: RateLimitResult
  if (db) {
    result = await hitDbRateLimit(db, key, opts)
  } else {
    const id = `${opts.limit}/${opts.windowMs}`
    if (!memory.has(id)) memory.set(id, createRateLimiter(opts))
    result = memory.get(id)!.hit(key)
  }
  if (!result.allowed) {
    setResponseHeader(event, 'Retry-After', result.retryAfter)
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
  return result
}

/**
 * Fixed-window rate limiter.
 *
 * IMPORTANT: the default store is in-memory, so it only protects a single
 * server process and resets on restart. It is a first layer for the pilot.
 * Production must add a shared store (database/Redis) and/or Cloudflare
 * rate-limiting rules (see SECURITY.md).
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Seconds until the window resets. */
  retryAfter: number
}

export interface RateLimiter {
  hit: (key: string) => RateLimitResult
}

export function createRateLimiter(options: {
  limit: number
  windowMs: number
  now?: () => number
  maxKeys?: number
}): RateLimiter {
  const { limit, windowMs, now = Date.now, maxKeys = 10_000 } = options
  const windows = new Map<string, { start: number; count: number }>()

  return {
    hit(key) {
      const t = now()
      let w = windows.get(key)
      if (!w || t - w.start >= windowMs) {
        // Bound memory: drop the oldest entry when full.
        if (!w && windows.size >= maxKeys) {
          const oldest = windows.keys().next().value
          if (oldest !== undefined) windows.delete(oldest)
        }
        w = { start: t, count: 0 }
        windows.set(key, w)
      }
      w.count++
      return {
        allowed: w.count <= limit,
        remaining: Math.max(0, limit - w.count),
        retryAfter: Math.ceil((w.start + windowMs - t) / 1000),
      }
    },
  }
}

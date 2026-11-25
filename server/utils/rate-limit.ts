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

/**
 * Shared (multi-process) fixed-window limiter on the rate_limits table.
 * One atomic upsert per hit: a stale window restarts at 1, otherwise the
 * counter increments. Keys are namespaced with "app:" so they never
 * collide with Better Auth's own entries.
 */
export async function hitDbRateLimit(
  db: import('../database/client').Database,
  key: string,
  opts: { limit: number; windowMs: number; now?: number },
): Promise<RateLimitResult> {
  const { sql } = await import('drizzle-orm')
  const { rateLimits } = await import('../database/schema')
  const now = opts.now ?? Date.now()
  const windowStart = now - opts.windowMs
  const [row] = await db
    .insert(rateLimits)
    .values({ key: `app:${key}`, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.lastRequest} < ${windowStart} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        lastRequest: sql`CASE WHEN ${rateLimits.lastRequest} < ${windowStart} THEN ${now} ELSE ${rateLimits.lastRequest} END`,
      },
    })
    .returning({ count: rateLimits.count, lastRequest: rateLimits.lastRequest })
  const count = row?.count ?? 1
  const started = row?.lastRequest ?? now
  return {
    allowed: count <= opts.limit,
    remaining: Math.max(0, opts.limit - count),
    retryAfter: Math.max(1, Math.ceil((started + opts.windowMs - now) / 1000)),
  }
}

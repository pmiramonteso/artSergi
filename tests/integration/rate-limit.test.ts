import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { hitDbRateLimit } from '../../server/utils/rate-limit'
import type { Database } from '../../server/database/client'
import { createTestDatabase } from './db'

let db: Database
let close: () => Promise<void>
beforeAll(async () => ({ db, close } = await createTestDatabase()))
afterAll(() => close())

describe('database rate limiter (shared across processes)', () => {
  it('counts per key within the window and resets after it', async () => {
    const o = { limit: 3, windowMs: 60_000 }
    const t0 = 1_000_000
    const hits = []
    for (let i = 0; i < 4; i++) hits.push(await hitDbRateLimit(db, 'k1', { ...o, now: t0 + i }))
    expect(hits.map((h) => h.allowed)).toEqual([true, true, true, false])
    expect((await hitDbRateLimit(db, 'k2', { ...o, now: t0 })).allowed).toBe(true)
    expect((await hitDbRateLimit(db, 'k1', { ...o, now: t0 + 60_001 })).allowed).toBe(true)
  })

  it('stays exact under concurrent hits', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => hitDbRateLimit(db, 'burst', { limit: 5, windowMs: 60_000 })),
    )
    expect(results.filter((r) => r.allowed)).toHaveLength(5)
  })
})

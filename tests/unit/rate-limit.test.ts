import { describe, expect, it } from 'vitest'
import { createRateLimiter } from '../../server/utils/rate-limit'

describe('createRateLimiter', () => {
  it('allows up to the limit per window, per key', () => {
    let t = 0
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t })
    expect(rl.hit('a').allowed).toBe(true)
    expect(rl.hit('a').allowed).toBe(true)
    const blocked = rl.hit('a')
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBe(1)
    expect(rl.hit('b').allowed).toBe(true)
    t = 1000
    expect(rl.hit('a').allowed).toBe(true)
  })

  it('bounds memory by evicting the oldest key', () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2, now: () => 0 })
    rl.hit('a')
    rl.hit('b')
    rl.hit('c') // evicts "a"
    expect(rl.hit('a').allowed).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { isRateLimited } from '../api/_lib/rateLimit.js'

// Each test uses its own unique key so cases can't pollute each other via
// the module's shared in-memory bucket map.
let counter = 0
function uniqueKey(label: string) {
  counter += 1
  return `${label}-${counter}`
}

describe('isRateLimited', () => {
  it('allows requests up to the max before limiting', () => {
    const key = uniqueKey('basic')
    // maxHits=3 means calls 1-3 return false (length <= 3), call 4+ returns
    // true (limiter checks length > maxHits AFTER pushing the current hit).
    expect(isRateLimited(key, 60_000, 3)).toBe(false) // 1
    expect(isRateLimited(key, 60_000, 3)).toBe(false) // 2
    expect(isRateLimited(key, 60_000, 3)).toBe(false) // 3
    expect(isRateLimited(key, 60_000, 3)).toBe(true)  // 4 (length 4 > maxHits 3)
  })

  it('tracks separate keys independently', () => {
    const keyA = uniqueKey('a')
    const keyB = uniqueKey('b')
    for (let i = 0; i < 10; i++) isRateLimited(keyA, 60_000, 2)
    // keyB should be unaffected by keyA's hits
    expect(isRateLimited(keyB, 60_000, 2)).toBe(false)
  })

  it('lets old hits fall outside the window and stop counting', () => {
    const key = uniqueKey('window')
    // Use a very short window so hits "expire" almost immediately.
    isRateLimited(key, 1, 1)
    isRateLimited(key, 1, 1)
    // At this point we're already at the limit within the 1ms window.
    // Wait past the window, then a fresh hit should not be limited.
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(isRateLimited(key, 1, 1)).toBe(false)
        resolve()
      }, 10)
    })
  })

  it('a maxHits of 0 blocks every call including the first', () => {
    const key = uniqueKey('zero')
    expect(isRateLimited(key, 60_000, 0)).toBe(true)
  })
})

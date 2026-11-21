import { describe, expect, it } from 'vitest'
import { calculateStreak } from '../src/lib/streak'

// Local-time constructor so the tests do not depend on the machine's timezone.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString()
const NOW = new Date(2026, 10, 21, 9) // 21 Nov 2026, 09:00 local

describe('date-based streak', () => {
  it('is zero with no activity', () => {
    expect(calculateStreak([], NOW)).toEqual({ current: 0, longest: 0, activeToday: false })
  })

  it('counts consecutive local days ending today', () => {
    const result = calculateStreak([at(2026, 11, 21, 8), at(2026, 11, 20), at(2026, 11, 19)], NOW)
    expect(result).toEqual({ current: 3, longest: 3, activeToday: true })
  })

  it('keeps the streak alive when the learner was active yesterday but not yet today', () => {
    const result = calculateStreak([at(2026, 11, 20), at(2026, 11, 19)], NOW)
    expect(result.current).toBe(2)
    expect(result.activeToday).toBe(false)
  })

  it('resets once a whole day has been missed', () => {
    const result = calculateStreak([at(2026, 11, 19), at(2026, 11, 18)], NOW)
    expect(result.current).toBe(0)
    expect(result.longest).toBe(2)
  })

  it('counts several events on the same day once', () => {
    const result = calculateStreak([at(2026, 11, 21, 1), at(2026, 11, 21, 5), at(2026, 11, 21, 8)], NOW)
    expect(result.current).toBe(1)
  })

  it('reports the longest earlier run separately from the current one', () => {
    const result = calculateStreak(
      [at(2026, 11, 21), at(2026, 11, 10), at(2026, 11, 9), at(2026, 11, 8), at(2026, 11, 7)],
      NOW,
    )
    expect(result.current).toBe(1)
    expect(result.longest).toBe(4)
  })

  it('handles month and year boundaries', () => {
    const now = new Date(2027, 0, 1, 10)
    const result = calculateStreak([at(2027, 1, 1), at(2026, 12, 31), at(2026, 12, 30)], now)
    expect(result.current).toBe(3)
  })

  it('ignores invalid and far-future timestamps', () => {
    const result = calculateStreak(['not-a-date', at(2027, 6, 1), at(2026, 11, 21)], NOW)
    expect(result.current).toBe(1)
  })
})

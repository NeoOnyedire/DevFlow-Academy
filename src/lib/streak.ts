// src/lib/streak.ts
//
// Date-based learning streak. Input is a list of timestamps at which the
// learner did something real (finished a lesson, completed a challenge);
// output is how many consecutive calendar days they were active.
//
// Days are the learner's LOCAL calendar days, not UTC — otherwise a
// learner in UTC+2 who studies at 00:30 would see their streak break.
//
// A streak is still alive if the learner was active yesterday but has not
// yet been active today: it only resets once a whole day has been missed.

export interface StreakSummary {
  /** Consecutive active days ending today (or yesterday, if not yet active today). */
  current: number
  /** Longest run of consecutive active days within the supplied history. */
  longest: number
  /** True when the learner has already been active today. */
  activeToday: boolean
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function previousDay(date: Date): Date {
  // setDate handles month/year rollover and DST shifts, unlike subtracting 24h.
  const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  prev.setDate(prev.getDate() - 1)
  return prev
}

export function calculateStreak(timestamps: readonly string[], now: Date = new Date()): StreakSummary {
  const activeDays = new Set<string>()
  const dates: Date[] = []

  for (const value of timestamps) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime()) || date.getTime() > now.getTime() + 24 * 60 * 60 * 1000) continue
    const key = dayKey(date)
    if (!activeDays.has(key)) {
      activeDays.add(key)
      dates.push(date)
    }
  }

  if (activeDays.size === 0) return { current: 0, longest: 0, activeToday: false }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const activeToday = activeDays.has(dayKey(today))

  // Current streak: walk backwards from today (or yesterday if today is still empty).
  let cursor = activeToday ? today : previousDay(today)
  let current = 0
  while (activeDays.has(dayKey(cursor))) {
    current += 1
    cursor = previousDay(cursor)
  }

  // Longest streak: a day starts a run if the day before it is not active.
  let longest = 0
  for (const date of dates) {
    if (activeDays.has(dayKey(previousDay(date)))) continue
    let length = 0
    let walker = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    while (activeDays.has(dayKey(walker))) {
      length += 1
      walker = new Date(walker.getFullYear(), walker.getMonth(), walker.getDate() + 1)
    }
    longest = Math.max(longest, length)
  }

  return { current, longest: Math.max(longest, current), activeToday }
}

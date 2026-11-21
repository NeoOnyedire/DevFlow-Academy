// src/lib/weeklyStanding.ts
//
// Fetch wrapper around GET /api/leaderboard?standing=1 — the signed-in
// learner's real rank for the current week.

export interface WeeklyStanding {
  weekKey: string
  points: number
  /** null until the learner has earned points this week. */
  rank: number | null
  participants: number
}

export async function fetchWeeklyStanding(): Promise<{ standing: WeeklyStanding | null; error: string | null }> {
  try {
    const response = await fetch('/api/leaderboard?standing=1', { credentials: 'same-origin' })
    const data = await response.json()
    if (!response.ok) {
      return {
        standing: null,
        error: typeof data?.error === 'string' ? data.error : 'Could not load your ranking.',
      }
    }
    if (typeof data?.points !== 'number' || typeof data?.participants !== 'number') {
      return { standing: null, error: 'Unexpected response while loading your ranking.' }
    }
    return {
      standing: {
        weekKey: String(data.weekKey ?? ''),
        points: data.points,
        rank: typeof data.rank === 'number' ? data.rank : null,
        participants: data.participants,
      },
      error: null,
    }
  } catch {
    return { standing: null, error: 'Could not reach the server to load your ranking.' }
  }
}

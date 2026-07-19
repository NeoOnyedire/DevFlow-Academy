// api/leaderboard.ts
//
// Real Repo Royale leaderboard, backed by Postgres — replaces the
// hardcoded LEADERBOARD array that used to live in ChallengeSection.tsx.
//
// Why this couldn't just be another Upstash Redis key: the leaderboard
// needs "total points per user, ranked, optionally filtered to one
// week" — a GROUP BY + window function (RANK()) query. That's exactly
// what a relational database is for for, and awkward to fake with flat
// key-value storage.
//
// GET  ?week=<weekKey>   -> public, top 10 for that week (or all-time if omitted)
// GET  ?mine=1           -> requires login, returns this account's own
//   completed challenge ids. A row in leaderboard_entries for
//   (user_id, challengeId) already is proof that challenge was
//   completed, so this reads that directly instead of relying on a
//   separate "completed" flag stored anywhere else.
// POST { points, weekKey, challengeId } -> requires login, records this
//   account's points for one challenge. ON CONFLICT DO NOTHING (see
//   db/schema.sql's unique index) means clicking "complete" twice never
//   double-counts the same challenge.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { getUserIdFromRequest } from './_lib/session.js'
import { getUserById } from './_lib/users.js'

const MAX_POINTS_PER_CHALLENGE = 1000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ---- Read: public, no auth needed ----
  if (req.method === 'GET') {
    // "Which challenges have I already completed?" — used to derive
    // hasCompletedWeeklyChallenge without a separate local flag.
    if (req.query.mine === '1' || req.query.mine === 'true') {
      const userId = getUserIdFromRequest(req)
      if (!userId) {
        res.status(401).json({ error: 'You need to be logged in to see your challenge history.' })
        return
      }
      try {
        const result = await sql`
          SELECT challenge_id FROM leaderboard_entries WHERE user_id = ${userId}
        `
        res.status(200).json({ challengeIds: result.rows.map(row => row.challenge_id) })
      } catch {
        res.status(502).json({ error: 'Could not load your challenge history right now.' })
      }
      return
    }

    const weekKey = typeof req.query.week === 'string' ? req.query.week : null

    try {
      // RANK() OVER (...) assigns a rank based on summed points per user,
      // so ties share a rank the way a real leaderboard should.
      const result = weekKey
        ? await sql`
            SELECT
              user_name,
              SUM(points)::int AS total_points,
              RANK() OVER (ORDER BY SUM(points) DESC) AS rank
            FROM leaderboard_entries
            WHERE week_key = ${weekKey}
            GROUP BY user_name
            ORDER BY total_points DESC
            LIMIT 10
          `
        : await sql`
            SELECT
              user_name,
              SUM(points)::int AS total_points,
              RANK() OVER (ORDER BY SUM(points) DESC) AS rank
            FROM leaderboard_entries
            GROUP BY user_name
            ORDER BY total_points DESC
            LIMIT 10
          `

      res.status(200).json({ entries: result.rows })
    } catch {
      res.status(502).json({ error: 'Could not load the leaderboard right now.' })
    }
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // ---- Write: must be signed in — points are recorded against the
  // real account, never a name typed into the request body ----
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'You need to be logged in to record challenge points.' })
    return
  }

  const { points, weekKey, challengeId } = (req.body || {}) as {
    points?: number
    weekKey?: string
    challengeId?: string
  }

  if (typeof points !== 'number' || !Number.isInteger(points) || points < 0 || points > MAX_POINTS_PER_CHALLENGE) {
    res.status(400).json({ error: 'Invalid points value.' })
    return
  }
  if (!weekKey || typeof weekKey !== 'string' || !challengeId || typeof challengeId !== 'string') {
    res.status(400).json({ error: 'Missing weekKey or challengeId.' })
    return
  }

  try {
    const user = await getUserById(userId)
    if (!user) {
      res.status(401).json({ error: 'Your session has expired. Please log in again.' })
      return
    }

    // ON CONFLICT targets the unique (user_id, challenge_id) index in
    // db/schema.sql — a second "complete" click for the same challenge
    // is a silent no-op instead of adding points twice.
    await sql`
      INSERT INTO leaderboard_entries (user_id, user_name, points, week_key, challenge_id)
      VALUES (${userId}, ${user.name}, ${points}, ${weekKey}, ${challengeId})
      ON CONFLICT (user_id, challenge_id) DO NOTHING
    `

    res.status(200).json({ ok: true })
  } catch {
    res.status(502).json({ error: 'Could not save your challenge points right now.' })
  }
}

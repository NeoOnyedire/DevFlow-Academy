// api/admin/[action].ts
//
// Consolidated into one dynamic route, same pattern as
// api/auth/[action].ts — keeps this well under Vercel's Hobby-plan
// Serverless Function cap instead of one file per admin action.
//
// Every request must pass requireAdmin() first (api/_lib/admin.ts) —
// which re-checks the session cookie server-side against the one GitHub
// account allowed to call any of this. Every destructive action is
// logged to admin_actions (db/migrations/003_admin_audit_log.sql).
//
// GET  /api/admin/stats                       -> dashboard counts
// GET  /api/admin/users                       -> every user account
// GET  /api/admin/reviews                     -> every review (admin view)
// GET  /api/admin/leaderboard?week=<key>      -> raw leaderboard rows for a week (or recent, all-time)
// POST /api/admin/delete-progress          { userId }
// POST /api/admin/toggle-review-flag       { userId, hasReviewedCourse }
// POST /api/admin/delete-review            { reviewId } | { rawIndex }  (rawIndex for legacy reviews with no id)
// POST /api/admin/delete-leaderboard-entry { id }
// POST /api/admin/reset-week               { weekKey }

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../_lib/admin.js'
import { sql } from '../_lib/db.js'
import { getAllUsers, getUserById, saveUser, deleteUser, backfillAllUsersSet } from '../_lib/users.js'
import { getUpstashConfig, upstashLRem, upstashLLen } from '../_lib/upstash.js'

const REVIEWS_KEY = 'devflow:reviews'

async function logAction(adminUserId: string, action: string, target: string | null, details: unknown) {
  try {
    await sql`
      INSERT INTO admin_actions (admin_user_id, action, target, details)
      VALUES (${adminUserId}, ${action}, ${target}, ${JSON.stringify(details)})
    `
  } catch {
    // Logging is best-effort — never block the actual admin action on it.
  }
}

interface StoredReview {
  id?: string
  rating: number
  comment: string
  date: string
  userName: string
}

async function fetchAllReviews(): Promise<{ raw: string; review: StoredReview }[]> {
  const config = getUpstashConfig()
  if (!config) return []
  const len = await upstashLLen(REVIEWS_KEY)
  if (len === 0) return []
  const res = await fetch(`${config.url}/lrange/${REVIEWS_KEY}/0/${len - 1}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { result?: string[] }
  const rows = data.result || []
  return rows
    .map(raw => {
      try {
        return { raw, review: JSON.parse(raw) as StoredReview }
      } catch {
        return null
      }
    })
    .filter((r): r is { raw: string; review: StoredReview } => !!r)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req)
  if (!admin) {
    res.status(403).json({ error: 'Not authorized.' })
    return
  }

  const action = typeof req.query.action === 'string' ? req.query.action : ''

  try {
    // ---- stats ----
    if (action === 'stats' && req.method === 'GET') {
      const [progressCount, lessonCount, leaderboardCount, users, reviews] = await Promise.all([
        sql`SELECT COUNT(DISTINCT user_id)::int AS c FROM user_progress`,
        sql`SELECT COUNT(*)::int AS c FROM lesson_progress`,
        sql`SELECT COUNT(*)::int AS c FROM leaderboard_entries`,
        getAllUsers(),
        fetchAllReviews(),
      ])
      res.status(200).json({
        totalUsers: users.length,
        usersWithProgress: progressCount.rows[0]?.c ?? 0,
        totalLessonRows: lessonCount.rows[0]?.c ?? 0,
        totalLeaderboardEntries: leaderboardCount.rows[0]?.c ?? 0,
        totalReviews: reviews.length,
      })
      return
    }

    // ---- users ----
    if (action === 'users' && req.method === 'GET') {
      const users = await getAllUsers()
      res.status(200).json({ users })
      return
    }

    // ---- reviews (admin view — includes legacy reviews with no id) ----
    if (action === 'reviews' && req.method === 'GET') {
      const rows = await fetchAllReviews()
      res.status(200).json({
        reviews: rows.map((r, i) => ({ ...r.review, id: r.review.id ?? null, rawIndex: i })),
      })
      return
    }

    // ---- leaderboard (raw rows, admin view) ----
    if (action === 'leaderboard' && req.method === 'GET') {
      const weekKey = typeof req.query.week === 'string' ? req.query.week : null
      const result = weekKey
        ? await sql`SELECT id, user_id, user_name, points, week_key, challenge_id, created_at
                     FROM leaderboard_entries WHERE week_key = ${weekKey} ORDER BY created_at DESC`
        : await sql`SELECT id, user_id, user_name, points, week_key, challenge_id, created_at
                     FROM leaderboard_entries ORDER BY created_at DESC LIMIT 200`
      res.status(200).json({ entries: result.rows })
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    // ---- delete a user's entire course progress ----
    if (action === 'delete-progress') {
      const { userId } = (req.body || {}) as { userId?: string }
      if (!userId) { res.status(400).json({ error: 'Missing userId.' }); return }

      await sql`DELETE FROM user_progress WHERE user_id = ${userId}`
      await sql`DELETE FROM lesson_progress WHERE user_id = ${userId}`
      await logAction(admin.id, 'delete-progress', userId, {})
      res.status(200).json({ ok: true })
      return
    }

    // ---- flip whether a user is allowed to submit another review ----
    if (action === 'toggle-review-flag') {
      const { userId, hasReviewedCourse } = (req.body || {}) as { userId?: string; hasReviewedCourse?: boolean }
      if (!userId || typeof hasReviewedCourse !== 'boolean') {
        res.status(400).json({ error: 'Missing userId or hasReviewedCourse.' })
        return
      }
      const user = await getUserById(userId)
      if (!user) { res.status(404).json({ error: 'User not found.' }); return }
      user.hasReviewedCourse = hasReviewedCourse
      await saveUser(user)
      await logAction(admin.id, 'toggle-review-flag', userId, { hasReviewedCourse })
      res.status(200).json({ ok: true })
      return
    }

    // ---- delete a review (by stable id, or by rawIndex for legacy rows without one) ----
    if (action === 'delete-review') {
      const { reviewId, rawIndex } = (req.body || {}) as { reviewId?: string; rawIndex?: number }
      const all = await fetchAllReviews()

      const target = reviewId
        ? all.find(r => r.review.id === reviewId)
        : typeof rawIndex === 'number' ? all[rawIndex] : undefined

      if (!target) { res.status(404).json({ error: 'Review not found.' }); return }

      const removed = await upstashLRem(REVIEWS_KEY, target.raw)
      if (!removed) { res.status(502).json({ error: 'Could not remove the review.' }); return }

      await logAction(admin.id, 'delete-review', reviewId || `rawIndex:${rawIndex}`, { userName: target.review.userName })
      res.status(200).json({ ok: true })
      return
    }

    // ---- delete one leaderboard row ----
    if (action === 'delete-leaderboard-entry') {
      const { id } = (req.body || {}) as { id?: number }
      if (typeof id !== 'number') { res.status(400).json({ error: 'Missing id.' }); return }
      await sql`DELETE FROM leaderboard_entries WHERE id = ${id}`
      await logAction(admin.id, 'delete-leaderboard-entry', String(id), {})
      res.status(200).json({ ok: true })
      return
    }

    // ---- wipe an entire week's leaderboard ----
    if (action === 'reset-week') {
      const { weekKey } = (req.body || {}) as { weekKey?: string }
      if (!weekKey) { res.status(400).json({ error: 'Missing weekKey.' }); return }
      await sql`DELETE FROM leaderboard_entries WHERE week_key = ${weekKey}`
      await logAction(admin.id, 'reset-week', weekKey, {})
      res.status(200).json({ ok: true })
      return
    }

    // ---- full account deletion (Redis record + every dependent Postgres row) ----
    if (action === 'delete-account') {
      const { userId } = (req.body || {}) as { userId?: string }
      if (!userId) { res.status(400).json({ error: 'Missing userId.' }); return }

      const target = await getUserById(userId)
      if (!target) { res.status(404).json({ error: 'User not found.' }); return }

      await sql`DELETE FROM user_progress WHERE user_id = ${userId}`
      await sql`DELETE FROM lesson_progress WHERE user_id = ${userId}`
      await sql`DELETE FROM leaderboard_entries WHERE user_id = ${userId}`
      const removed = await deleteUser(userId)

      if (!removed) { res.status(502).json({ error: 'Could not delete the account.' }); return }

      await logAction(admin.id, 'delete-account', userId, { name: target.name, email: target.email })
      res.status(200).json({ ok: true })
      return
    }

    // ---- one-time backfill of devflow:all-users for pre-existing accounts ----
    if (action === 'backfill-users') {
      const result = await backfillAllUsersSet()
      await logAction(admin.id, 'backfill-users', null, result)
      res.status(200).json({ ok: true, ...result })
      return
    }

    res.status(404).json({ error: 'Unknown admin action.' })
  } catch {
    res.status(502).json({ error: 'Admin action failed. Check server logs.' })
  }
}
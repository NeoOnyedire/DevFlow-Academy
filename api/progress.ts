// api/progress.ts
//
// Course progress — replaces the old `devflow_progress_<userId>` key in
// localStorage. A module is "completed" if a row exists in
// user_progress for (user_id, module_id), "not completed" if it
// doesn't — no separate boolean flag to keep in sync.
//
// Requires login for both GET and POST: progress is meaningless for a
// guest with no account, and this endpoint never trusts a user id from
// the request body — it always comes from the session cookie.
//
// GET  -> { completedModules: string[] }  all completed module ids for this account
// POST { moduleId, completed } -> marks or unmarks one module

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { getUserIdFromRequest } from './_lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'You need to be logged in to sync progress.' })
    return
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT module_id FROM user_progress WHERE user_id = ${userId}
      `
      res.status(200).json({ completedModules: result.rows.map(row => row.module_id) })
    } catch {
      res.status(502).json({ error: 'Could not load your progress right now.' })
    }
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { moduleId, completed } = (req.body || {}) as { moduleId?: string; completed?: boolean }

  if (!moduleId || typeof moduleId !== 'string') {
    res.status(400).json({ error: 'Missing moduleId.' })
    return
  }
  if (typeof completed !== 'boolean') {
    res.status(400).json({ error: 'Missing completed flag.' })
    return
  }

  try {
    if (completed) {
      // ON CONFLICT DO NOTHING — marking an already-completed module
      // complete again is a silent no-op, not a duplicate row or an error.
      await sql`
        INSERT INTO user_progress (user_id, module_id)
        VALUES (${userId}, ${moduleId})
        ON CONFLICT (user_id, module_id) DO NOTHING
      `
    } else {
      await sql`
        DELETE FROM user_progress WHERE user_id = ${userId} AND module_id = ${moduleId}
      `
    }
    res.status(200).json({ ok: true })
  } catch {
    res.status(502).json({ error: 'Could not save your progress right now.' })
  }
}

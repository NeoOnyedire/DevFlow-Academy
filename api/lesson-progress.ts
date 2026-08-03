// api/lesson-progress.ts
//
// Per-lesson progress — sits alongside the existing api/progress.ts
// (whole-module completion). A lesson moves through 'video' -> 'quiz'
// -> 'sandbox' -> 'complete'; only 'complete' rows count.
//
// The client sends the full list of lesson ids that belong to a module
// (from src/content/lessons.ts) on every POST, so this endpoint never
// needs its own copy of the curriculum structure — it just checks
// "are all of these ids now complete?" and if so, upserts the module
// itself into the existing user_progress table, the same way a
// whole-module completion always has.
//
// GET  ?moduleId=<id>            -> { completedLessonIds: string[] } for that module
// GET  (no moduleId)             -> { completedLessonIds: string[] } across ALL modules
// POST { lessonId, moduleId, step, allLessonIdsInModule } -> upserts progress,
//   and rolls the module up to complete in user_progress if this finishes it.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_lib/db.js'
import { getUserIdFromRequest } from './_lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'You need to be logged in to sync lesson progress.' })
    return
  }

  if (req.method === 'GET') {
    const moduleId = typeof req.query.moduleId === 'string' ? req.query.moduleId : null
    try {
      const result = moduleId
        ? await sql`
            SELECT lesson_id FROM lesson_progress
            WHERE user_id = ${userId} AND module_id = ${moduleId} AND step = 'complete'
          `
        : await sql`
            SELECT lesson_id FROM lesson_progress
            WHERE user_id = ${userId} AND step = 'complete'
          `
      res.status(200).json({ completedLessonIds: result.rows.map(row => row.lesson_id) })
    } catch {
      res.status(502).json({ error: 'Could not load your lesson progress right now.' })
    }
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { lessonId, moduleId, step, allLessonIdsInModule } = (req.body || {}) as {
    lessonId?: string
    moduleId?: string
    step?: string
    allLessonIdsInModule?: string[]
  }

  if (!lessonId || !moduleId || !step) {
    res.status(400).json({ error: 'Missing lessonId, moduleId, or step.' })
    return
  }
  if (!['video', 'quiz', 'sandbox', 'complete'].includes(step)) {
    res.status(400).json({ error: 'Invalid step.' })
    return
  }

  try {
    // Upsert — a learner revisiting an earlier step (e.g. re-watching)
    // just updates the row rather than erroring or duplicating it.
    await sql`
      INSERT INTO lesson_progress (user_id, module_id, lesson_id, step)
      VALUES (${userId}, ${moduleId}, ${lessonId}, ${step})
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET step = ${step}, completed_at = now()
    `

    let moduleCompleted = false

    // Only bother checking module-level rollup if this call just finished
    // a lesson and told us the full lesson list for the module.
    if (step === 'complete' && Array.isArray(allLessonIdsInModule) && allLessonIdsInModule.length > 0) {
      const result = await sql`
        SELECT lesson_id FROM lesson_progress
        WHERE user_id = ${userId} AND module_id = ${moduleId} AND step = 'complete'
      `
      const completedSet = new Set(result.rows.map(row => row.lesson_id))
      moduleCompleted = allLessonIdsInModule.every(id => completedSet.has(id))

      if (moduleCompleted) {
        // Same table/shape api/progress.ts already writes to — a module
        // finished lesson-by-lesson looks identical to one marked done
        // the old way, so nothing downstream needs to know the difference.
        await sql`
          INSERT INTO user_progress (user_id, module_id)
          VALUES (${userId}, ${moduleId})
          ON CONFLICT (user_id, module_id) DO NOTHING
        `
      }
    }

    res.status(200).json({ ok: true, moduleCompleted })
  } catch {
    res.status(502).json({ error: 'Could not save your lesson progress right now.' })
  }
}

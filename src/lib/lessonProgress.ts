// src/lib/lessonProgress.ts
//
// Thin fetch wrappers around /api/lesson-progress. Mirrors the pattern
// already used for /api/progress in AppContext.tsx — best-effort POSTs
// that don't block the UI on failure, since local state already reflects
// the change either way.

export async function fetchCompletedLessonIds(moduleId?: string): Promise<string[]> {
  try {
    const url = moduleId ? `/api/lesson-progress?moduleId=${encodeURIComponent(moduleId)}` : '/api/lesson-progress'
    const response = await fetch(url, { credentials: 'same-origin' })
    const data = await response.json()
    return Array.isArray(data.completedLessonIds) ? data.completedLessonIds : []
  } catch {
    return []
  }
}

/** Returns whether this call finished the whole module, best-effort. */
export async function saveLessonStep(
  lessonId: string,
  moduleId: string,
  step: 'video' | 'quiz' | 'sandbox' | 'complete',
  allLessonIdsInModule?: string[]
): Promise<{ ok: boolean; moduleCompleted: boolean }> {
  try {
    const response = await fetch('/api/lesson-progress', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, moduleId, step, allLessonIdsInModule }),
    })
    const data = await response.json()
    return { ok: response.ok, moduleCompleted: !!data.moduleCompleted }
  } catch {
    return { ok: false, moduleCompleted: false }
  }
}

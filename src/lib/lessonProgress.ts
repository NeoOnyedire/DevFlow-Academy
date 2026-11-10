// src/lib/lessonProgress.ts
//
// Fetch wrappers around /api/lesson-progress. Failures are returned to
// callers so the learner can distinguish unsynced progress from success.

export interface LessonProgressResult {
  ids: string[]
  error: string | null
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
    return data.error
  }
  return fallback
}

export async function fetchCompletedLessonIds(moduleId?: string): Promise<LessonProgressResult> {
  try {
    const url = moduleId ? `/api/lesson-progress?moduleId=${encodeURIComponent(moduleId)}` : '/api/lesson-progress'
    const response = await fetch(url, { credentials: 'same-origin' })
    const data = await response.json()
    if (!response.ok) {
      return { ids: [], error: getErrorMessage(data, 'Could not load your lesson progress. Please try again.') }
    }
    if (!Array.isArray(data.completedLessonIds)) {
      return { ids: [], error: 'Unexpected response while loading your lesson progress. Please try again.' }
    }
    return { ids: data.completedLessonIds, error: null }
  } catch {
    return { ids: [], error: 'Could not reach the server to load your lesson progress. Please try again.' }
  }
}

/** Returns whether this call finished the whole module and any sync error. */
export async function saveLessonStep(
  lessonId: string,
  moduleId: string,
  step: 'video' | 'quiz' | 'sandbox' | 'complete',
  allLessonIdsInModule?: string[]
): Promise<{ ok: boolean; moduleCompleted: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/lesson-progress', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, moduleId, step, allLessonIdsInModule }),
    })
    const data = await response.json()
    if (!response.ok) {
      return {
        ok: false,
        moduleCompleted: false,
        error: getErrorMessage(data, 'Could not save your lesson progress. Please try again.'),
      }
    }
    return { ok: true, moduleCompleted: !!data.moduleCompleted, error: null }
  } catch {
    return {
      ok: false,
      moduleCompleted: false,
      error: 'Could not reach the server to save your lesson progress. Please try again.',
    }
  }
}

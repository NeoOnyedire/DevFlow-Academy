import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '../api/_lib/vercel'

const mocks = vi.hoisted(() => ({
  sql: vi.fn(),
  getUserIdFromRequest: vi.fn(),
}))

vi.mock('../api/_lib/db.js', () => ({ sql: mocks.sql }))
vi.mock('../api/_lib/session.js', () => ({ getUserIdFromRequest: mocks.getUserIdFromRequest }))

import handler from '../api/lesson-progress.js'

function createResponse() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    },
  }
}

async function request(method: string, body?: unknown, query: Record<string, string | string[]> = {}) {
  const req = { method, body, query } as unknown as VercelRequest
  const res = createResponse()
  await handler(req, res as unknown as VercelResponse)
  return res
}

beforeEach(() => {
  mocks.sql.mockReset().mockResolvedValue({ rows: [] })
  mocks.getUserIdFromRequest.mockReset().mockReturnValue('user-1')
})

describe('lesson progress API', () => {
  it('requires a signed-in user to read or save lesson progress', async () => {
    mocks.getUserIdFromRequest.mockReturnValue(null)

    const readResponse = await request('GET')
    const saveResponse = await request('POST', {
      lessonId: 'lesson-1',
      moduleId: 'module-1',
      step: 'complete',
    })

    expect(readResponse.statusCode).toBe(401)
    expect(saveResponse.statusCode).toBe(401)
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('rejects missing and unsupported lesson progress fields', async () => {
    const missingResponse = await request('POST', { lessonId: 'lesson-1' })
    const invalidStepResponse = await request('POST', {
      lessonId: 'lesson-1',
      moduleId: 'module-1',
      step: 'finished',
    })

    expect(missingResponse.statusCode).toBe(400)
    expect(invalidStepResponse.statusCode).toBe(400)
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('returns a clear error when saved progress cannot be written', async () => {
    mocks.sql.mockRejectedValueOnce(new Error('database unavailable'))

    const response = await request('POST', {
      lessonId: 'lesson-1',
      moduleId: 'module-1',
      step: 'complete',
      allLessonIdsInModule: ['lesson-1'],
    })

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({ error: 'Could not save your lesson progress right now.' })
  })

  it('returns a clear error when progress cannot be loaded', async () => {
    mocks.sql.mockRejectedValueOnce(new Error('database unavailable'))

    const response = await request('GET', undefined, { moduleId: 'module-1' })

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({ error: 'Could not load your lesson progress right now.' })
  })

  it('saves lesson completion and rolls up a fully completed module', async () => {
    mocks.sql.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ lesson_id: 'lesson-1' }] })
      .mockResolvedValueOnce({ rows: [] })

    const response = await request('POST', {
      lessonId: 'lesson-1',
      moduleId: 'module-1',
      step: 'complete',
      allLessonIdsInModule: ['lesson-1'],
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({ ok: true, moduleCompleted: true })
    expect(mocks.sql).toHaveBeenCalledTimes(3)
  })
})

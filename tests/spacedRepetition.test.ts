import { describe, expect, it } from 'vitest'
import {
  getDueReviewCards,
  getReviewCards,
  recordMissedQuestion,
  recordReviewAnswer,
  type ReviewStorage,
} from '../src/lib/spacedRepetition'

class MemoryStorage implements ReviewStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const question = {
  id: 'q1',
  question: 'What does git commit do?',
  options: ['Saves a snapshot', 'Creates a remote'],
  correctIndex: 0,
  explanation: 'A commit records a snapshot of staged changes.',
}

const input = {
  lessonId: 'mod-01-lesson-01',
  lessonTitle: 'Git basics',
  moduleTitle: 'Git foundations',
  question,
}

describe('spaced repetition', () => {
  it('schedules missed questions for the next day and makes them due at that time', () => {
    const storage = new MemoryStorage()
    const now = Date.UTC(2026, 0, 1)

    expect(recordMissedQuestion(input, now, storage).ok).toBe(true)
    expect(getDueReviewCards(now, storage)).toEqual([])
    expect(getDueReviewCards(now + 24 * 60 * 60 * 1000, storage)).toHaveLength(1)
  })

  it('uses increasing intervals after correct recall and resets the interval after a miss', () => {
    const storage = new MemoryStorage()
    const now = Date.UTC(2026, 0, 1)
    recordMissedQuestion(input, now, storage)

    expect(recordReviewAnswer('mod-01-lesson-01:q1', true, now, storage).ok).toBe(true)
    expect(getReviewCards(storage)[0]).toMatchObject({ repetitions: 1, intervalDays: 1 })

    expect(recordReviewAnswer('mod-01-lesson-01:q1', true, now + 24 * 60 * 60 * 1000, storage).ok).toBe(true)
    expect(getReviewCards(storage)[0]).toMatchObject({ repetitions: 2, intervalDays: 3 })

    expect(recordReviewAnswer('mod-01-lesson-01:q1', false, now + 4 * 24 * 60 * 60 * 1000, storage).ok).toBe(true)
    expect(getReviewCards(storage)[0]).toMatchObject({ repetitions: 0, intervalDays: 1, missedCount: 2 })
  })

  it('updates an existing card instead of duplicating a missed question', () => {
    const storage = new MemoryStorage()
    recordMissedQuestion(input, Date.UTC(2026, 0, 1), storage)
    recordMissedQuestion(input, Date.UTC(2026, 0, 2), storage)

    expect(getReviewCards(storage)).toHaveLength(1)
    expect(getReviewCards(storage)[0].missedCount).toBe(2)
  })

  it('keeps questions from separate lessons as distinct review cards', () => {
    const storage = new MemoryStorage()
    recordMissedQuestion(input, Date.UTC(2026, 0, 1), storage)
    recordMissedQuestion({ ...input, lessonId: 'mod-02-lesson-01' }, Date.UTC(2026, 0, 1), storage)

    expect(getReviewCards(storage)).toHaveLength(2)
  })
})

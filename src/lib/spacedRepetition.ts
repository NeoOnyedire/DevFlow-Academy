import type { QuizQuestion } from '../content/lessons'

const STORAGE_KEY = 'devflow_spaced_review_v1'
const INTERVALS_DAYS = [1, 3, 7, 14, 30]
const DAY_MS = 24 * 60 * 60 * 1000

export interface ReviewCard {
  id: string
  lessonId: string
  lessonTitle: string
  moduleTitle: string
  question: QuizQuestion
  repetitions: number
  intervalDays: number
  dueAt: number
  lastReviewedAt: number | null
  missedCount: number
}

export interface ReviewCardInput {
  lessonId: string
  lessonTitle: string
  moduleTitle: string
  question: QuizQuestion
}

export interface ReviewStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface ReviewStorageResult {
  ok: boolean
  error: string | null
}

export interface ReviewQueueResult {
  cards: ReviewCard[]
  error: string | null
}

function isReviewCard(value: unknown): value is ReviewCard {
  if (typeof value !== 'object' || value === null) return false
  const card = value as Partial<ReviewCard>
  const question = card.question as Partial<QuizQuestion> | undefined
  return typeof card.id === 'string'
    && typeof card.lessonId === 'string'
    && typeof card.lessonTitle === 'string'
    && typeof card.moduleTitle === 'string'
    && typeof question?.id === 'string'
    && typeof question.question === 'string'
    && Array.isArray(question.options)
    && question.options.every(option => typeof option === 'string')
    && Number.isInteger(question.correctIndex)
    && question.correctIndex >= 0
    && question.correctIndex < question.options.length
    && typeof question.explanation === 'string'
    && typeof card.repetitions === 'number'
    && typeof card.intervalDays === 'number'
    && typeof card.dueAt === 'number'
    && (typeof card.lastReviewedAt === 'number' || card.lastReviewedAt === null)
    && typeof card.missedCount === 'number'
}

function readCards(storage: ReviewStorage): ReviewCard[] {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed.filter(isReviewCard) : []
}

function writeCards(storage: ReviewStorage, cards: ReviewCard[]): ReviewStorageResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cards))
    return { ok: true, error: null }
  } catch {
    return { ok: false, error: 'Could not save your review queue in this browser.' }
  }
}

export function loadReviewCards(storage?: ReviewStorage): ReviewQueueResult {
  try {
    const target = storage ?? window.localStorage
    return { cards: readCards(target).sort((a, b) => a.dueAt - b.dueAt), error: null }
  } catch {
    return { cards: [], error: 'Could not load your review queue in this browser.' }
  }
}

export function getReviewCards(storage?: ReviewStorage): ReviewCard[] {
  return loadReviewCards(storage).cards
}

export function getDueReviewCards(now = Date.now(), storage?: ReviewStorage): ReviewCard[] {
  return loadReviewCards(storage).cards.filter(card => card.dueAt <= now)
}

export function recordMissedQuestion(
  input: ReviewCardInput,
  now = Date.now(),
  storage?: ReviewStorage,
): ReviewStorageResult {
  let cards: ReviewCard[]
  let target: ReviewStorage
  try {
    target = storage ?? window.localStorage
    cards = readCards(target)
  } catch {
    return { ok: false, error: 'Could not read your review queue in this browser.' }
  }

  const id = `${input.lessonId}:${input.question.id}`
  const existing = cards.find(card => card.id === id)
  const nextCard: ReviewCard = {
    id,
    ...input,
    repetitions: 0,
    intervalDays: 1,
    dueAt: now + DAY_MS,
    lastReviewedAt: existing?.lastReviewedAt ?? null,
    missedCount: (existing?.missedCount ?? 0) + 1,
  }
  const nextCards = existing
    ? cards.map(card => card.id === id ? nextCard : card)
    : [...cards, nextCard]
  return writeCards(target, nextCards)
}

export function recordReviewAnswer(
  id: string,
  correct: boolean,
  now = Date.now(),
  storage?: ReviewStorage,
): ReviewStorageResult {
  let cards: ReviewCard[]
  let target: ReviewStorage
  try {
    target = storage ?? window.localStorage
    cards = readCards(target)
  } catch {
    return { ok: false, error: 'Could not read your review queue in this browser.' }
  }

  const card = cards.find(item => item.id === id)
  if (!card) return { ok: false, error: 'This review card is no longer in your queue. Reload the page and try again.' }

  const repetitions = correct ? card.repetitions + 1 : 0
  const intervalDays = correct
    ? INTERVALS_DAYS[Math.min(repetitions - 1, INTERVALS_DAYS.length - 1)]
    : 1
  const updated: ReviewCard = {
    ...card,
    repetitions,
    intervalDays,
    dueAt: now + intervalDays * DAY_MS,
    lastReviewedAt: now,
    missedCount: correct ? card.missedCount : card.missedCount + 1,
  }
  return writeCards(target, cards.map(item => item.id === id ? updated : item))
}

export function getReviewIntervalLabel(intervalDays: number): string {
  return intervalDays === 1 ? '1 day' : `${intervalDays} days`
}

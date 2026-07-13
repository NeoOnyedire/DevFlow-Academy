// api/reviews.ts
//
// Serverless endpoint for DevFlow Academy's course reviews.
//
// Reviews are shared across everyone who visits the site — stored in the
// same Upstash Redis database as user accounts, not in any one visitor's
// browser.
//
// Submitting a review now requires being signed in (a valid session
// cookie — see api/_lib/session.ts), and each account can only submit
// once: the server checks and sets `hasReviewedCourse` on the account
// record itself (api/_lib/users.ts), so clearing your browser or using
// a different tab can't be used to submit a second review. The display
// name attached to a review is taken from the account, not from
// whatever the client sends, so it can't be spoofed either.
//
// ---- One-time setup ----
//   1. Create a free database at https://console.upstash.com (Redis).
//   2. Copy its "REST URL" and "REST TOKEN" from the database dashboard.
//   3. Set them as environment variables:
//        UPSTASH_REDIS_REST_URL
//        UPSTASH_REDIS_REST_TOKEN
//      In Vercel: Project Settings -> Environment Variables (Production
//      and Preview). Locally: add them to .env.local (never commit that
//      file). You'll also need SESSION_SECRET set — see api/_lib/session.ts.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUpstashConfig } from './_lib/upstash'
import { getUserIdFromRequest } from './_lib/session'
import { getUserById, saveUser } from './_lib/users'

interface StoredReview {
  rating: number
  comment: string
  date: string
  userName: string
}

const REVIEWS_KEY = 'devflow:reviews'
const MAX_REVIEWS_RETURNED = 50
const MAX_COMMENT_LEN = 600
const MIN_COMMENT_LEN = 10

// ---- Best-effort per-IP rate limiter, write path only ----
// Defense in depth on top of the one-review-per-account rule below —
// resets on cold start, not a hard guarantee across all instances.
const WINDOW_MS = 60_000
const MAX_WRITES_PER_WINDOW = 5
const ipHits = new Map<string, number[]>()

function isIpRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipHits.get(ip) || []).filter(t => now - t < WINDOW_MS)
  timestamps.push(now)
  ipHits.set(ip, timestamps)
  if (ipHits.size > 5000) ipHits.clear()
  return timestamps.length > MAX_WRITES_PER_WINDOW
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  return (
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

/** Reads the most recent reviews, newest first (LPUSH means index 0 is newest). */
async function fetchReviews(): Promise<StoredReview[]> {
  const config = getUpstashConfig()
  if (!config) return []

  const response = await fetch(`${config.url}/lrange/${REVIEWS_KEY}/0/${MAX_REVIEWS_RETURNED - 1}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  })
  if (!response.ok) return []

  const data = (await response.json()) as { result?: string[] }
  const rows = data.result || []

  return rows
    .map(row => {
      try {
        return JSON.parse(row) as StoredReview
      } catch {
        return null
      }
    })
    .filter((r): r is StoredReview => !!r)
}

async function pushReview(review: StoredReview): Promise<boolean> {
  const config = getUpstashConfig()
  if (!config) return false

  const response = await fetch(`${config.url}/lpush/${REVIEWS_KEY}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(review),
  })
  if (!response.ok) return false

  // Cap history so the list doesn't grow forever.
  await fetch(`${config.url}/ltrim/${REVIEWS_KEY}/0/499`, {
    headers: { Authorization: `Bearer ${config.token}` },
  }).catch(() => {})

  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ---- Read: public, no auth needed, anyone can see reviews ----
  if (req.method === 'GET') {
    try {
      const reviews = await fetchReviews()
      res.status(200).json({ reviews })
    } catch {
      res.status(502).json({ error: 'Could not load reviews right now.' })
    }
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!getUpstashConfig()) {
    res.status(500).json({ error: 'Reviews storage is not configured on the server.' })
    return
  }

  // ---- Write: must be signed in ----
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'You need to be logged in to submit a review.' })
    return
  }

  const user = await getUserById(userId)
  if (!user) {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' })
    return
  }

  if (user.hasReviewedCourse) {
    res.status(409).json({ error: "You've already submitted a review with this account." })
    return
  }

  const ip = getClientIp(req)
  if (isIpRateLimited(ip)) {
    res.status(429).json({ error: 'Too many reviews submitted. Please slow down and try again shortly.' })
    return
  }

  const { rating, comment } = (req.body || {}) as { rating?: number; comment?: string }

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' })
    return
  }
  if (typeof comment !== 'string' || comment.trim().length < MIN_COMMENT_LEN) {
    res.status(400).json({ error: `Review must be at least ${MIN_COMMENT_LEN} characters.` })
    return
  }
  if (comment.length > MAX_COMMENT_LEN) {
    res.status(400).json({ error: `Review must be under ${MAX_COMMENT_LEN} characters.` })
    return
  }

  // Display name comes from the account, not the request body — can't be spoofed.
  const review: StoredReview = {
    rating,
    comment: comment.trim(),
    date: new Date().toISOString(),
    userName: user.name,
  }

  try {
    const ok = await pushReview(review)
    if (!ok) {
      res.status(502).json({ error: 'Could not save your review right now. Please try again.' })
      return
    }

    user.hasReviewedCourse = true
    await saveUser(user)

    res.status(200).json({ ok: true, review })
  } catch {
    res.status(502).json({ error: 'Could not save your review right now. Please try again.' })
  }
}

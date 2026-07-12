// api/reviews.ts
//
// Serverless endpoint for DevFlow Academy's course reviews.
//
// Reviews are now genuinely shared across everyone who visits the site —
// they're stored in a small Upstash Redis database (via its REST API),
// not in any one visitor's browser. This replaces the earlier version,
// where "reviews" only ever lived in localStorage and were only ever
// visible on the same browser that wrote them, despite the UI implying
// they were public.
//
// ---- One-time setup ----
//   1. Create a free database at https://console.upstash.com (Redis,
//      "Regional" or "Global" — either works fine for this volume).
//   2. On the database's dashboard, copy the "REST URL" and
//      "REST TOKEN" (NOT the redis:// connection string — the REST
//      ones, since this project talks to Upstash over HTTPS like it
//      already does for GitHub/Gemini/Groq elsewhere in /api).
//   3. Set them as environment variables named exactly:
//        UPSTASH_REDIS_REST_URL
//        UPSTASH_REDIS_REST_TOKEN
//      In Vercel: Project Settings -> Environment Variables, added for
//      Production AND Preview. Locally: put them in .env.local (this
//      file is already gitignored — never commit real credentials).
//
// Neither value is ever sent to the browser — only this function talks
// to Upstash, the same way api/gitter.ts is the only thing that talks
// to the AI providers.

import type { VercelRequest, VercelResponse } from '@vercel/node'

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
const MAX_NAME_LEN = 60

// ---- Best-effort per-IP rate limiter, write path only ----
// Resets on cold start — enough to stop casual spam of this endpoint,
// not a hard guarantee across all instances.
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

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/+$/, ''), token }
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

  const ip = getClientIp(req)
  if (isIpRateLimited(ip)) {
    res.status(429).json({ error: 'Too many reviews submitted. Please slow down and try again shortly.' })
    return
  }

  const { rating, comment, userName } = (req.body || {}) as {
    rating?: number
    comment?: string
    userName?: string
  }

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

  const cleanName = (typeof userName === 'string' ? userName.trim() : '').slice(0, MAX_NAME_LEN) || 'Anonymous'

  const review: StoredReview = {
    rating,
    comment: comment.trim(),
    date: new Date().toISOString(),
    userName: cleanName,
  }

  try {
    const ok = await pushReview(review)
    if (!ok) {
      res.status(502).json({ error: 'Could not save your review right now. Please try again.' })
      return
    }
    res.status(200).json({ ok: true, review })
  } catch {
    res.status(502).json({ error: 'Could not save your review right now. Please try again.' })
  }
}

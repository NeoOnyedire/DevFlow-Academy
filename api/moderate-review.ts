/**
 * api/moderate-review.ts
 *
 * AI moderation gate in front of review submission. Requires the reviewer
 * to have activated Gitter AI (their own BYOK key), and uses that same
 * key/provider to ask whether the review looks like genuine, on-topic
 * feedback before api/reviews.ts's real write path runs.
 *
 * This is a soft filter, not a security boundary — api/reviews.ts still
 * independently enforces login, one-review-per-account, and rate limits
 * regardless of what happens here. If the AI response can't be parsed or
 * the provider has a hiccup, moderation fails OPEN (the review is allowed
 * through) rather than blocking a real learner over a formatting issue.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUserIdFromRequest } from './_lib/session.js'
import { callProvider, type AiProvider } from './_lib/aiProviders.js'
import { isRateLimited } from './_lib/rateLimit.js'

const MODERATION_SYSTEM_PROMPT = `You are a content moderator for DevFlow Academy's course reviews. You will be given a star rating (1-5) and a written review comment from a real course participant.

Reject the review ONLY if it:
- Is spam, gibberish, or clearly not a genuine reaction to the course
- Contains a URL, link, or promotion of another website, product, or unrelated service
- Contains hate speech, harassment, or profanity
- Has no actual content related to the course (completely off-topic)

Do NOT reject reviews just for being short, blunt, or critical — genuine negative feedback is welcome and should be approved.

Respond with ONLY valid JSON, nothing else, in exactly this shape:
{"valid": true or false, "reply": "a warm, specific 1-2 sentence message written directly to the reviewer — if valid, thank them for their specific feedback; if invalid, briefly explain what needs to change and invite them to try again, without repeating any spam/links back."}`

interface ModerationResult {
  valid: boolean
  reply: string
}

function parseModerationResponse(raw: string): ModerationResult {
  try {
    const cleaned = raw.trim().replace(/^```json\s*|```\s*$/g, '')
    const parsed = JSON.parse(cleaned)
    if (typeof parsed.valid === 'boolean' && typeof parsed.reply === 'string') {
      return { valid: parsed.valid, reply: parsed.reply.slice(0, 500) }
    }
  } catch {
    // fall through to fail-open default below
  }
  return { valid: true, reply: 'Thanks for your feedback!' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'You need to be logged in to submit a review.' })
    return
  }

  if (isRateLimited(`moderate-review:${userId}`, 60_000, 5)) {
    res.status(429).json({ error: 'Too many attempts. Please slow down and try again shortly.' })
    return
  }

  const { rating, comment, apiKey, provider } = (req.body || {}) as {
    rating?: number
    comment?: string
    apiKey?: string
    provider?: AiProvider
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    res.status(401).json({
      error: 'GITTER_AI_REQUIRED',
      message: 'Activate Gitter AI with a free API key before leaving a review — this keeps reviews genuine.',
    })
    return
  }
  if (provider !== 'gemini' && provider !== 'groq' && provider !== 'anthropic') {
    res.status(400).json({ error: 'Unknown or missing provider.' })
    return
  }
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Invalid rating.' })
    return
  }
  if (typeof comment !== 'string' || comment.trim().length < 10) {
    res.status(400).json({ error: 'Review is too short to check.' })
    return
  }

  try {
    const result = await callProvider(
      provider,
      apiKey.trim(),
      MODERATION_SYSTEM_PROMPT,
      [{ role: 'user', content: `Rating: ${rating}/5\nComment: ${comment.trim()}` }],
      300
    )

    if (!result.ok) {
      if (result.status === 400 || result.status === 401 || result.status === 403) {
        res.status(401).json({
          error: 'INVALID_API_KEY',
          message: 'Your AI key was rejected — check it in Gitter settings and try again.',
        })
        return
      }
      // Provider hiccup — fail open rather than block a genuine reviewer.
      res.status(200).json({ valid: true, reply: 'Thanks for your feedback!' })
      return
    }

    res.status(200).json(parseModerationResponse(result.text || ''))
  } catch {
    // Network hiccup reaching the provider — fail open.
    res.status(200).json({ valid: true, reply: 'Thanks for your feedback!' })
  }
}
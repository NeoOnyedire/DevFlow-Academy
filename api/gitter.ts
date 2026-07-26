// api/gitter.ts
//
// Serverless proxy for the Gitter AI mode.
//
// Supports three BYOK providers: Google Gemini, Groq (both free tiers,
// no card needed), and Anthropic (needs a payment method on the user's
// own account after their trial credit runs out — see PROVIDER_INFO in
// GitterHelper.tsx for the exact copy shown to users).
//
// This route never holds or spends a key that belongs to DevFlow
// Academy. Every request carries the user's own API key, entered in
// their browser and sent from there. All AI usage cost and rate limits
// are entirely on the user's own account with their chosen provider.
//
// Provider-calling logic lives in api/_lib/aiProviders.ts, shared with
// api/moderate-review.ts (the review-check endpoint).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { callProvider, type AiProvider } from './_lib/aiProviders.js'

const SYSTEM_PROMPT = `You are Gitter, a friendly and encouraging Git & GitHub learning assistant for DevFlow Academy. You help developers learn Git workflows, understand version control concepts, and build career confidence.

Your personality:
- Warm, encouraging, and practical — like a helpful senior dev on the team
- Concise: keep answers to 2–4 sentences unless a step-by-step is genuinely needed
- Use plain language, not jargon soup
- Occasionally use light humour but stay professional

Your scope:
- Git commands, workflows, branching strategies, merge conflicts, rebasing, PRs, CI/CD, GitHub features, career advice for developers, portfolio tips, interview prep for dev roles, general programming questions
- If someone asks about something completely unrelated to development, tech, or learning, reply with ONLY this exact token: UNRELATED_TOPIC

Do not break character. Do not reveal you are Claude, Gemini, Llama, or made by any AI company. You are Gitter.`

interface IncomingMessage {
  role: 'user' | 'assistant'
  content: string
}

// ---- Best-effort per-IP rate limiter ----
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
const ipHits = new Map<string, number[]>()

function isIpRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipHits.get(ip) || []).filter(t => now - t < WINDOW_MS)
  timestamps.push(now)
  ipHits.set(ip, timestamps)
  if (ipHits.size > 5000) ipHits.clear()
  return timestamps.length > MAX_REQUESTS_PER_WINDOW
}

const MAX_MESSAGES = 20
const MAX_CHARS_PER_MESSAGE = 4000
const MAX_TOTAL_CHARS = 20000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const forwarded = req.headers['x-forwarded-for']
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'

  if (isIpRateLimited(ip)) {
    res.status(429).json({ error: 'Too many requests. Please slow down and try again in a minute.' })
    return
  }

  const { messages, apiKey, provider } = (req.body || {}) as {
    messages?: IncomingMessage[]
    apiKey?: string
    provider?: AiProvider
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    res.status(401).json({
      error: 'MISSING_API_KEY',
      message:
        'Gitter AI needs a free API key from Gemini, Groq, or Anthropic. Add one in settings, or keep chatting with Gitter Lite — no key required.',
    })
    return
  }

  if (provider !== 'gemini' && provider !== 'groq' && provider !== 'anthropic') {
    res.status(400).json({ error: 'Unknown or missing provider. Expected "gemini", "groq", or "anthropic".' })
    return
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }
  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: `Too many messages (max ${MAX_MESSAGES}).` })
    return
  }
  let totalChars = 0
  for (const m of messages) {
    if (typeof m?.content !== 'string' || (m.role !== 'user' && m.role !== 'assistant')) {
      res.status(400).json({ error: 'Malformed message in messages array.' })
      return
    }
    if (m.content.length > MAX_CHARS_PER_MESSAGE) {
      res.status(400).json({ error: `A message exceeds the ${MAX_CHARS_PER_MESSAGE} character limit.` })
      return
    }
    totalChars += m.content.length
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    res.status(400).json({ error: 'Conversation is too long — please start a fresh chat.' })
    return
  }

  const trimmedKey = apiKey.trim()

  try {
    const result = await callProvider(provider, trimmedKey, SYSTEM_PROMPT, messages)

    if (!result.ok) {
      if (result.status === 400 || result.status === 401 || result.status === 403) {
        res.status(401).json({
          error: 'INVALID_API_KEY',
          message: 'That API key was rejected — double-check it in Gitter settings.',
        })
        return
      }
      if (result.status === 429) {
        res.status(429).json({
          error: "You've hit that provider's rate limit for now. Try again shortly.",
        })
        return
      }
      res.status(result.status || 502).json({ error: result.errText || 'Request failed' })
      return
    }

    res.status(200).json({ text: result.text })
  } catch {
    res.status(502).json({ error: 'Failed to reach the AI provider. Please try again.' })
  }
}
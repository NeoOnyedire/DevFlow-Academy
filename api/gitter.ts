// api/gitter.ts
//
// Serverless proxy for the Gitter AI mode.
//
// Supports two free, no-credit-card-required providers:
//   - Google Gemini  (the easy default — "log in with Google, copy a key")
//   - Groq           (fast, free tier, email-only signup)
//
// IMPORTANT: This route never holds or spends a key that belongs to
// DevFlow Academy. Every request must carry the user's own API key,
// entered in their browser and sent from there. All AI usage cost and
// rate limits are entirely on the user's own account with their chosen
// provider — never on us.
//
// We still apply a light per-IP rate limit and payload validation here,
// purely to protect this serverless function itself from being spammed
// or abused — not to manage any spend, since we never pay for any AI
// call made through this endpoint.
//
// Gitter's default "Lite" mode (see src/lib/gitterLite.ts) requires no
// key and no network call at all, and remains the experience for anyone
// who hasn't opted into AI mode.

import type { VercelRequest, VercelResponse } from '@vercel/node'

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

type Provider = 'gemini' | 'groq'

interface IncomingMessage {
  role: 'user' | 'assistant'
  content: string
}

// ---- Best-effort per-IP rate limiter ----
// Resets on cold start. This is intentionally simple: it protects this
// function's own uptime from being hammered, not any AI spend (there is
// none on our side). For a hard guarantee across cold starts, swap in
// Vercel KV / Upstash Redis — not required for correctness here.
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
const ipHits = new Map<string, number[]>()

function isIpRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipHits.get(ip) || []).filter(t => now - t < WINDOW_MS)
  timestamps.push(now)
  ipHits.set(ip, timestamps)
  // Cheap cleanup so the map doesn't grow unbounded between cold starts
  if (ipHits.size > 5000) ipHits.clear()
  return timestamps.length > MAX_REQUESTS_PER_WINDOW
}

const MAX_MESSAGES = 20
const MAX_CHARS_PER_MESSAGE = 4000
const MAX_TOTAL_CHARS = 20000

interface ProviderResult {
  ok: boolean
  text?: string
  status?: number
  errText?: string
}

/** Calls Google Gemini's generateContent endpoint with the user's own key. */
async function callGemini(apiKey: string, messages: IncomingMessage[]): Promise<ProviderResult> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 600 },
      }),
    }
  )

  if (!response.ok) {
    return { ok: false, status: response.status, errText: await response.text() }
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I am having a moment — try again?'
  return { ok: true, text }
}

/** Calls Groq's OpenAI-compatible chat completions endpoint with the user's own key. */
async function callGroq(apiKey: string, messages: IncomingMessage[]): Promise<ProviderResult> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!response.ok) {
    return { ok: false, status: response.status, errText: await response.text() }
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? 'I am having a moment — try again?'
  return { ok: true, text }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // ---- Rate limit by best-effort client IP ----
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
    provider?: Provider
  }

  // ---- BYOK: every request must supply the user's own key ----
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    res.status(401).json({
      error: 'MISSING_API_KEY',
      message:
        'Gitter AI needs a free API key from Gemini or Groq. Add one in settings, or keep chatting with Gitter Lite — no key required.',
    })
    return
  }

  if (provider !== 'gemini' && provider !== 'groq') {
    res.status(400).json({ error: 'Unknown or missing provider. Expected "gemini" or "groq".' })
    return
  }

  // ---- Payload validation ----
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
    const result =
      provider === 'groq' ? await callGroq(trimmedKey, messages) : await callGemini(trimmedKey, messages)

    if (!result.ok) {
      // Both providers return 400/401/403 for bad keys, in slightly different shapes.
      if (result.status === 400 || result.status === 401 || result.status === 403) {
        res.status(401).json({
          error: 'INVALID_API_KEY',
          message: 'That API key was rejected — double-check it in Gitter settings.',
        })
        return
      }
      if (result.status === 429) {
        res.status(429).json({
          error: "You've hit that provider's free rate limit for now. Try again shortly.",
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

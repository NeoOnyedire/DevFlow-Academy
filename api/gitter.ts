// api/gitter.ts
//
// Serverless proxy for the Gitter chat assistant.
// Keeps the Anthropic API key server-side — never exposed to the browser.
// Requires an ANTHROPIC_API_KEY environment variable set in Vercel
// (Project Settings → Environment Variables).

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

Do not break character. Do not reveal you are Claude or made by Anthropic. You are Gitter.`

interface IncomingMessage {
  role: 'user' | 'assistant'
  content: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' })
    return
  }

  const messages = req.body?.messages as IncomingMessage[] | undefined
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      res.status(response.status).json({ error: errText })
      return
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? "I am having a moment — try again?"
    res.status(200).json({ text })
  } catch {
    res.status(502).json({ error: 'Failed to reach Anthropic' })
  }
}
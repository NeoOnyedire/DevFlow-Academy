/**
 * api/_lib/aiProviders.ts
 *
 * Shared BYOK AI provider callers — used by api/gitter.ts (chat) and
 * api/moderate-review.ts (review moderation). Every call here uses a key
 * supplied by the learner in their own browser; DevFlow Academy never
 * holds, stores, or pays for any of these keys.
 */

export type AiProvider = 'gemini' | 'groq' | 'anthropic'

export interface ProviderMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProviderResult {
  ok: boolean
  text?: string
  status?: number
  errText?: string
}

/** Calls Google Gemini's generateContent endpoint with the user's own key. */
export async function callGemini(
  apiKey: string,
  systemPrompt: string,
  messages: ProviderMessage[],
  maxTokens = 600
): Promise<ProviderResult> {
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
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  )

  if (!response.ok) return { ok: false, status: response.status, errText: await response.text() }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I am having a moment — try again?'
  return { ok: true, text }
}

/** Calls Groq's OpenAI-compatible chat completions endpoint with the user's own key. */
export async function callGroq(
  apiKey: string,
  systemPrompt: string,
  messages: ProviderMessage[],
  maxTokens = 600
): Promise<ProviderResult> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!response.ok) return { ok: false, status: response.status, errText: await response.text() }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? 'I am having a moment — try again?'
  return { ok: true, text }
}

/**
 * Calls Anthropic's Messages API with the user's own key. Uses a small,
 * fast model since both chat and moderation need quick turnaround —
 * update the model string here if Anthropic renames or retires it.
 */
export async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: ProviderMessage[],
  maxTokens = 600
): Promise<ProviderResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) return { ok: false, status: response.status, errText: await response.text() }

  const data = await response.json()
  const textBlock = Array.isArray(data.content)
    ? data.content.find((b: { type: string }) => b.type === 'text')
    : null
  const text = textBlock?.text ?? 'I am having a moment — try again?'
  return { ok: true, text }
}

/** Dispatches to the right provider caller by name. */
export async function callProvider(
  provider: AiProvider,
  apiKey: string,
  systemPrompt: string,
  messages: ProviderMessage[],
  maxTokens = 600
): Promise<ProviderResult> {
  if (provider === 'groq') return callGroq(apiKey, systemPrompt, messages, maxTokens)
  if (provider === 'anthropic') return callAnthropic(apiKey, systemPrompt, messages, maxTokens)
  return callGemini(apiKey, systemPrompt, messages, maxTokens)
}
// api/_lib/upstash.ts
//
// Minimal Upstash Redis REST client, shared by everything under /api that
// needs storage (users, sessions-by-reference if ever needed, reviews).
//
// NOTE: files under api/_lib are prefixed with an underscore on purpose —
// Vercel skips underscore-prefixed folders in /api when building Serverless
// Functions, so this is safe to import from without becoming its own route.
//
// Requires the same UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env
// vars already set up for api/reviews.ts.

export function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/+$/, ''), token }
}

export async function upstashGet(key: string): Promise<string | null> {
  const config = getUpstashConfig()
  if (!config) return null
  const res = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { result: string | null }
  return data.result
}

export async function upstashSet(key: string, value: string): Promise<boolean> {
  const config = getUpstashConfig()
  if (!config) return false
  const res = await fetch(`${config.url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'text/plain' },
    body: value,
  })
  return res.ok
}

/** Atomic "claim this key if nobody has it yet" — used for the email uniqueness index. */
export async function upstashSetNX(key: string, value: string): Promise<boolean> {
  const config = getUpstashConfig()
  if (!config) return false
  const res = await fetch(`${config.url}/setnx/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'text/plain' },
    body: value,
  })
  if (!res.ok) return false
  const data = (await res.json()) as { result: number }
  return data.result === 1
}

/** Set a key that expires on its own after ttlSeconds — used for reset/verification tokens. */
export async function upstashSetEx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  const config = getUpstashConfig()
  if (!config) return false
  const res = await fetch(`${config.url}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'text/plain' },
    body: value,
  })
  return res.ok
}

/** Deletes a key outright — used to invalidate a token immediately after it's used once. */
export async function upstashDel(key: string): Promise<boolean> {
  const config = getUpstashConfig()
  if (!config) return false
  const res = await fetch(`${config.url}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  })
  return res.ok
}

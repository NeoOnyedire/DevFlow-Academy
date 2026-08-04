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

/** Adds a member to a Redis set — used for the enumerable "all users" index. */
export async function upstashSAdd(key: string, member: string): Promise<boolean> {
  const config = getUpstashConfig()
  if (!config) return false
  const res = await fetch(`${config.url}/sadd/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}` },
  })
  return res.ok
}

/** Returns every member of a Redis set. */
export async function upstashSMembers(key: string): Promise<string[]> {
  const config = getUpstashConfig()
  if (!config) return []
  const res = await fetch(`${config.url}/smembers/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { result?: string[] }
  return data.result || []
}

/** Removes every exact-match occurrence of a value from a Redis list. */
export async function upstashLRem(key: string, value: string): Promise<boolean> {
  const config = getUpstashConfig()
  if (!config) return false
  const res = await fetch(`${config.url}/lrem/${encodeURIComponent(key)}/0`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'text/plain' },
    body: value,
  })
  return res.ok
}

/** Length of a Redis list. */
export async function upstashLLen(key: string): Promise<number> {
  const config = getUpstashConfig()
  if (!config) return 0
  const res = await fetch(`${config.url}/llen/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  })
  if (!res.ok) return 0
  const data = (await res.json()) as { result?: number }
  return data.result || 0
}

/** Runs an arbitrary Redis command via Upstash's generic REST endpoint. */
export async function upstashCommand(args: (string | number)[]): Promise<unknown> {
  const config = getUpstashConfig()
  if (!config) return null
  const res = await fetch(config.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { result?: unknown }
  return data.result ?? null
}

/** Removes a member from a Redis set — the inverse of upstashSAdd. */
export async function upstashSRem(key: string, member: string): Promise<boolean> {
  const result = await upstashCommand(['SREM', key, member])
  return typeof result === 'number' && result > 0
}
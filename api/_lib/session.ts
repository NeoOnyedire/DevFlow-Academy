// api/_lib/session.ts
//
// Signed, httpOnly session cookies — a lightweight hand-rolled equivalent
// of a JWT, using only Node's built-in `crypto` (no jsonwebtoken dependency
// to add). The cookie holds a user id and an expiry, HMAC-signed with a
// server-only secret so it can't be forged or edited client-side.
//
// Requires one new env var: SESSION_SECRET — any long random string.
// Generate one with, e.g.: `openssl rand -hex 32`
// Set it in Vercel (Production + Preview) and in .env.local for local dev.
// If it's ever rotated, everyone's session cookie is invalidated at once
// (they'll just need to log in again) — that's expected and safe.

import { createHmac } from 'crypto'
import type { VercelRequest } from '@vercel/node'

const SESSION_COOKIE = 'devflow_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not configured on the server.')
  return secret
}

function sign(body: string): string {
  return createHmac('sha256', getSecret()).update(body).digest('base64url')
}

/** Builds the Set-Cookie header value for a freshly authenticated session. */
export function createSessionCookie(userId: string): string {
  const payload = { uid: userId, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const token = `${body}.${sign(body)}`
  // Preview and Production deployments are both served over HTTPS, so it's
  // safe to require Secure there; local `vercel dev` runs as VERCEL_ENV=development.
  const isSecureEnv = process.env.VERCEL_ENV !== 'development'
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${isSecureEnv ? '; Secure' : ''}`
}

/** Builds the Set-Cookie header value that clears a session on logout. */
export function clearSessionCookie(): string {
  const isSecureEnv = process.env.VERCEL_ENV !== 'development'
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isSecureEnv ? '; Secure' : ''}`
}

/** Reads and verifies the session cookie on an incoming request, if any. Returns the user id or null. */
export function getUserIdFromRequest(req: VercelRequest): string | null {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null

  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${SESSION_COOKIE}=`))
  if (!match) return null

  const token = match.slice(SESSION_COOKIE.length + 1)
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  try {
    if (sig !== sign(body)) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as { uid: string; exp: number }
    if (typeof payload.uid !== 'string' || payload.exp < Date.now()) return null
    return payload.uid
  } catch {
    return null
  }
}

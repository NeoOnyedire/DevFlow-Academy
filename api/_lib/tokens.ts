// api/_lib/tokens.ts
//
// Opaque, single-use, expiring tokens for email verification and
// password reset links. Each token is just a random string mapped to a
// user id in Redis with a TTL — no JWT/signing needed here since the
// token itself has no meaningful payload beyond "look up this key".

import { randomBytes } from 'crypto'
import { upstashSetEx, upstashGet, upstashDel } from './upstash.js'

const VERIFY_TTL_SECONDS = 60 * 60 * 24 // 24 hours
const RESET_TTL_SECONDS = 60 * 60 // 1 hour

function verifyKey(token: string) {
  return `devflow:verify-token:${token}`
}
function resetKey(token: string) {
  return `devflow:reset-token:${token}`
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateToken()
  await upstashSetEx(verifyKey(token), userId, VERIFY_TTL_SECONDS)
  return token
}

/** Looks up and immediately invalidates a verification token — single use. */
export async function consumeVerificationToken(token: string): Promise<string | null> {
  const userId = await upstashGet(verifyKey(token))
  if (!userId) return null
  await upstashDel(verifyKey(token))
  return userId
}

export async function createResetToken(userId: string): Promise<string> {
  const token = generateToken()
  await upstashSetEx(resetKey(token), userId, RESET_TTL_SECONDS)
  return token
}

/** Looks up and immediately invalidates a reset token — single use. */
export async function consumeResetToken(token: string): Promise<string | null> {
  const userId = await upstashGet(resetKey(token))
  if (!userId) return null
  await upstashDel(resetKey(token))
  return userId
}

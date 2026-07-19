// api/_lib/users.ts
//
// Real, server-side user accounts — replaces the old localStorage
// `devflow_users` array. Stored in the same Upstash Redis database as
// reviews, under a different key namespace.
//
// Password hashing uses Node's built-in `scrypt` (via the `crypto`
// module) rather than adding a bcrypt dependency — it's a well-regarded
// KDF and ships with Node, so there's nothing new to `npm install`.
//
// Storage layout:
//   devflow:user:<id>                 -> JSON StoredUser
//   devflow:email-index:<lowercased>  -> id           (password accounts)
//   devflow:github-index:<githubId>   -> id           (GitHub accounts)

import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { upstashGet, upstashSet, upstashSetNX } from './upstash.js'

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash?: string // only present for provider: 'password'
  provider: 'password' | 'github'
  githubUsername?: string
  githubId?: number
  avatarUrl?: string
  hasReviewedCourse: boolean
  // GitHub accounts are created already verified — GitHub only hands us
  // a verified primary email in the first place (see api/auth/github.ts).
  // Password accounts start unverified and confirm via emailed link.
  emailVerified: boolean
  createdAt: string
}

/** The shape sent to the client — never includes passwordHash. */
export type SafeUser = Omit<StoredUser, 'passwordHash'>

function userKey(id: string) {
  return `devflow:user:${id}`
}
function emailIndexKey(email: string) {
  return `devflow:email-index:${email.toLowerCase()}`
}
function githubIndexKey(githubId: number) {
  return `devflow:github-index:${githubId}`
}

export function toSafeUser(user: StoredUser): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user
  return safe
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false
  const hash = scryptSync(password, salt, 64)
  const storedHash = Buffer.from(hashHex, 'hex')
  if (hash.length !== storedHash.length) return false
  return timingSafeEqual(hash, storedHash)
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const raw = await upstashGet(userKey(id))
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const id = await upstashGet(emailIndexKey(email))
  if (!id) return null
  return getUserById(id)
}

export async function getUserByGithubId(githubId: number): Promise<StoredUser | null> {
  const id = await upstashGet(githubIndexKey(githubId))
  if (!id) return null
  return getUserById(id)
}

export async function saveUser(user: StoredUser): Promise<boolean> {
  return upstashSet(userKey(user.id), JSON.stringify(user))
}

/** Creates a password account. Returns null if the email is already taken. */
export async function createPasswordUser(name: string, email: string, password: string): Promise<StoredUser | null> {
  const id = randomUUID()
  // Atomic claim on the email index — prevents a race between two
  // simultaneous registrations with the same email.
  const claimed = await upstashSetNX(emailIndexKey(email), id)
  if (!claimed) return null

  const user: StoredUser = {
    id,
    name,
    email,
    passwordHash: hashPassword(password),
    provider: 'password',
    hasReviewedCourse: false,
    emailVerified: false,
    createdAt: new Date().toISOString(),
  }
  await saveUser(user)
  return user
}

/** Finds the existing account for this GitHub profile, or creates one. */
export async function upsertGithubUser(profile: {
  githubId: number
  username: string
  name: string
  email: string
  avatarUrl: string
}): Promise<StoredUser> {
  const existing = await getUserByGithubId(profile.githubId)
  if (existing) {
    // Keep profile fields fresh — name/avatar/username can change on GitHub.
    const updated: StoredUser = {
      ...existing,
      name: profile.name,
      email: profile.email,
      githubUsername: profile.username,
      avatarUrl: profile.avatarUrl,
    }
    await saveUser(updated)
    return updated
  }

  const id = randomUUID()
  const user: StoredUser = {
    id,
    name: profile.name,
    email: profile.email,
    provider: 'github',
    githubUsername: profile.username,
    githubId: profile.githubId,
    avatarUrl: profile.avatarUrl,
    hasReviewedCourse: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  }
  await saveUser(user)
  await upstashSet(githubIndexKey(profile.githubId), id)
  return user
}

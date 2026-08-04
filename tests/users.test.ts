import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Upstash layer so these tests exercise users.ts's own logic
// (password hashing, id generation, delete fan-out) without needing a real
// Redis instance. Each test controls the in-memory "store" directly.
vi.mock('../api/_lib/upstash.js', () => {
  const store = new Map<string, string>()
  const sets = new Map<string, Set<string>>()

  return {
    __store: store,
    __sets: sets,
    getUpstashConfig: vi.fn(() => ({ url: 'http://fake', token: 'fake' })),
    upstashGet: vi.fn(async (key: string) => store.get(key) ?? null),
    upstashSet: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
      return true
    }),
    upstashSetNX: vi.fn(async (key: string, value: string) => {
      if (store.has(key)) return false
      store.set(key, value)
      return true
    }),
    upstashSAdd: vi.fn(async (key: string, member: string) => {
      const set = sets.get(key) ?? new Set<string>()
      const alreadyHad = set.has(member)
      set.add(member)
      sets.set(key, set)
      return !alreadyHad
    }),
    upstashSMembers: vi.fn(async (key: string) => Array.from(sets.get(key) ?? [])),
    upstashCommand: vi.fn(async (args: (string | number)[]) => {
      const [cmd, key] = args as [string, string]
      if (cmd === 'DEL') {
        const existed = store.has(key)
        store.delete(key)
        return existed ? 1 : 0
      }
      return null
    }),
    upstashSRem: vi.fn(async (key: string, member: string) => {
      const set = sets.get(key)
      if (!set || !set.has(member)) return false
      set.delete(member)
      return true
    }),
  }
})

import * as upstash from '../api/_lib/upstash.js'
import {
  hashPassword,
  verifyPassword,
  createPasswordUser,
  getUserByEmail,
  getUserById,
  deleteUser,
  toSafeUser,
  type StoredUser,
} from '../api/_lib/users.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedStore = (upstash as any).__store as Map<string, string>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedSets = (upstash as any).__sets as Map<string, Set<string>>

beforeEach(() => {
  mockedStore.clear()
  mockedSets.clear()
})

describe('hashPassword / verifyPassword', () => {
  it('produces a salt:hash pair, not the plaintext password', () => {
    const hashed = hashPassword('correct horse battery staple')
    expect(hashed).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    expect(hashed).not.toContain('correct horse battery staple')
  })

  it('verifies the correct password against its own hash', () => {
    const hashed = hashPassword('hunter2')
    expect(verifyPassword('hunter2', hashed)).toBe(true)
  })

  it('rejects an incorrect password', () => {
    const hashed = hashPassword('hunter2')
    expect(verifyPassword('wrong-password', hashed)).toBe(false)
  })

  it('produces a different hash each time due to random salt', () => {
    const first = hashPassword('same-password')
    const second = hashPassword('same-password')
    expect(first).not.toBe(second)
    expect(verifyPassword('same-password', first)).toBe(true)
    expect(verifyPassword('same-password', second)).toBe(true)
  })

  it('rejects malformed stored hashes instead of throwing', () => {
    expect(verifyPassword('anything', 'not-a-valid-stored-hash')).toBe(false)
    expect(verifyPassword('anything', '')).toBe(false)
  })
})

describe('toSafeUser', () => {
  it('strips passwordHash from the user object', () => {
    const user: StoredUser = {
      id: '1',
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: 'secret:hash',
      provider: 'password',
      hasReviewedCourse: false,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    }
    const safe = toSafeUser(user)
    expect(safe).not.toHaveProperty('passwordHash')
    expect(safe.email).toBe('ada@example.com')
  })
})

describe('createPasswordUser', () => {
  it('creates a new account with a hashed password and unverified email', async () => {
    const user = await createPasswordUser('Ada Lovelace', 'ada@example.com', 'mypassword')
    expect(user).not.toBeNull()
    expect(user!.provider).toBe('password')
    expect(user!.emailVerified).toBe(false)
    expect(user!.hasReviewedCourse).toBe(false)
    expect(user!.passwordHash).not.toBe('mypassword')
    expect(verifyPassword('mypassword', user!.passwordHash!)).toBe(true)
  })

  it('refuses to create a second account with the same email (race-safe claim)', async () => {
    const first = await createPasswordUser('Ada', 'dup@example.com', 'password1')
    const second = await createPasswordUser('Ada Impostor', 'dup@example.com', 'password2')
    expect(first).not.toBeNull()
    expect(second).toBeNull()
  })

  it('is retrievable by email afterward', async () => {
    await createPasswordUser('Grace Hopper', 'grace@example.com', 'password123')
    const found = await getUserByEmail('grace@example.com')
    expect(found).not.toBeNull()
    expect(found!.name).toBe('Grace Hopper')
  })
})

describe('deleteUser', () => {
  it('returns false for a user that does not exist', async () => {
    const result = await deleteUser('nonexistent-id')
    expect(result).toBe(false)
  })

  it('removes the user record so a subsequent lookup returns null', async () => {
    const user = await createPasswordUser('Delete Me', 'deleteme@example.com', 'password123')
    expect(user).not.toBeNull()

    const removed = await deleteUser(user!.id)
    expect(removed).toBe(true)

    const lookedUpAfter = await getUserById(user!.id)
    expect(lookedUpAfter).toBeNull()
  })

  it('frees up the email for a new registration after deletion', async () => {
    const user = await createPasswordUser('Reusable Email', 'reuse@example.com', 'password123')
    await deleteUser(user!.id)

    const secondAttempt = await createPasswordUser('New Owner', 'reuse@example.com', 'newpassword')
    expect(secondAttempt).not.toBeNull()
    expect(secondAttempt!.name).toBe('New Owner')
  })
})

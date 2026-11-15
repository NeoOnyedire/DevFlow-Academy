import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const values = new Map<string, string>()
  return {
    values,
    getUpstashConfig: vi.fn(() => ({ url: 'https://redis.example', token: 'test-token' })),
    upstashGet: vi.fn(async (key: string) => values.get(key) ?? null),
    upstashSet: vi.fn(async (key: string, value: string) => {
      values.set(key, value)
      return true
    }),
    upstashCommand: vi.fn(async (args: (string | number)[]) => {
      if (args[0] !== 'DEL') return null
      return args.slice(1).reduce((count, key) => count + Number(values.delete(String(key))), 0)
    }),
  }
})

vi.mock('../api/_lib/upstash.js', () => ({
  getUpstashConfig: mocks.getUpstashConfig,
  upstashGet: mocks.upstashGet,
  upstashSet: mocks.upstashSet,
  upstashCommand: mocks.upstashCommand,
}))

import {
  disconnectGitHubRepositoryAccess,
  getGitHubRepositoryToken,
  saveGitHubRepositoryToken,
} from '../api/_lib/githubRepoAccess.js'

beforeEach(() => {
  mocks.values.clear()
  mocks.getUpstashConfig.mockReturnValue({ url: 'https://redis.example', token: 'test-token' })
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-prod'
})

describe('encrypted GitHub repository access', () => {
  it('encrypts tokens at rest and decrypts them for server-side requests', async () => {
    const rawToken = 'gho-token-must-not-be-stored-plaintext'
    await saveGitHubRepositoryToken('user-123', rawToken)
    const stored = mocks.values.get('devflow:github-repo-token:user-123')

    expect(stored).toBeDefined()
    expect(stored).not.toContain(rawToken)
    await expect(getGitHubRepositoryToken('user-123')).resolves.toBe(rawToken)
  })

  it('rejects tampered encrypted token data', async () => {
    await saveGitHubRepositoryToken('user-123', 'gho-secret')
    const key = 'devflow:github-repo-token:user-123'
    const record = JSON.parse(mocks.values.get(key) || '{}') as { tag: string }
    record.tag = `${record.tag.slice(0, -1)}${record.tag.endsWith('A') ? 'B' : 'A'}`
    mocks.values.set(key, JSON.stringify(record))

    await expect(getGitHubRepositoryToken('user-123')).rejects.toThrow()
  })

  it('removes the encrypted token and selected repository when disconnected', async () => {
    await saveGitHubRepositoryToken('user-123', 'gho-secret')
    mocks.values.set('devflow:selected-github-repo:user-123', 'ada/project')

    await expect(disconnectGitHubRepositoryAccess('user-123')).resolves.toBe(true)
    expect(mocks.values.has('devflow:github-repo-token:user-123')).toBe(false)
    expect(mocks.values.has('devflow:selected-github-repo:user-123')).toBe(false)
  })

  it('fails explicitly when repository-token storage is not configured', async () => {
    mocks.getUpstashConfig.mockReturnValue(null)
    await expect(getGitHubRepositoryToken('user-123')).rejects.toThrow(/storage is not configured/)
  })
})

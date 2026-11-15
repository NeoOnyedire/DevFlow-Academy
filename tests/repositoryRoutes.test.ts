import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '../api/_lib/vercel'

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  getGitHubRepositoryToken: vi.fn(),
  getSelectedGitHubRepository: vi.fn(),
  saveSelectedGitHubRepository: vi.fn(),
  disconnectGitHubRepositoryAccess: vi.fn(),
}))

vi.mock('../api/_lib/session.js', () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))
vi.mock('../api/_lib/githubRepoAccess.js', () => ({
  getGitHubRepositoryToken: mocks.getGitHubRepositoryToken,
  getSelectedGitHubRepository: mocks.getSelectedGitHubRepository,
  saveSelectedGitHubRepository: mocks.saveSelectedGitHubRepository,
  disconnectGitHubRepositoryAccess: mocks.disconnectGitHubRepositoryAccess,
}))

import repositoryHandler from '../api/repositories/[action].js'

function createRequest(method: string, action: string, body?: unknown): VercelRequest {
  return { method, query: { action }, body, headers: {} } as unknown as VercelRequest
}

function createResponse() {
  const headers: Record<string, string> = {}
  return {
    statusCode: 0,
    body: undefined as unknown,
    headers,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    },
    setHeader(name: string, value: string) {
      headers[name] = value
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUserIdFromRequest.mockReturnValue('user-1')
  mocks.getGitHubRepositoryToken.mockResolvedValue('gho-server-only-token')
  mocks.getSelectedGitHubRepository.mockResolvedValue(null)
  mocks.saveSelectedGitHubRepository.mockResolvedValue(true)
  mocks.disconnectGitHubRepositoryAccess.mockResolvedValue(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('repository API route', () => {
  it('rejects repository identifiers that are not owner/repository names', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await repositoryHandler(
      createRequest('POST', 'select', { fullName: 'https://attacker.example/owner/repo' }),
      response as unknown as VercelResponse,
    )

    expect(response.statusCode).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns only repository metadata and language-based insights', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          full_name: 'ada/project',
          name: 'project',
          html_url: 'https://github.com/ada/project',
          description: 'A project',
          private: true,
          fork: false,
          default_branch: 'main',
          language: 'TypeScript',
          topics: ['learning'],
          open_issues_count: 2,
          stargazers_count: 4,
          updated_at: '2026-01-01T00:00:00Z',
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ TypeScript: 700, CSS: 300 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'ci.yml' }] })
    vi.stubGlobal('fetch', fetchMock)
    const response = createResponse()

    await repositoryHandler(
      createRequest('POST', 'select', { fullName: 'ada/project' }),
      response as unknown as VercelResponse,
    )

    expect(response.statusCode).toBe(200)
    expect(mocks.saveSelectedGitHubRepository).toHaveBeenCalledWith('user-1', 'ada/project')
    expect(fetchMock.mock.calls.every(([url, init]) =>
      String(url).startsWith('https://api.github.com/') && (init as RequestInit).method === undefined,
    )).toBe(true)
    expect(JSON.stringify(response.body)).not.toContain('gho-server-only-token')
    expect(response.body).toMatchObject({
      repository: {
        fullName: 'ada/project',
        private: true,
        languages: { TypeScript: 700, CSS: 300 },
        hasWorkflows: true,
      },
    })
  })
})

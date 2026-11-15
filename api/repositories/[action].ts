import type { VercelRequest, VercelResponse } from '../_lib/vercel.js'
import { getUserIdFromRequest } from '../_lib/session.js'
import {
  disconnectGitHubRepositoryAccess,
  getGitHubRepositoryToken,
  getSelectedGitHubRepository,
  saveSelectedGitHubRepository,
} from '../_lib/githubRepoAccess.js'

interface GitHubRepository {
  full_name: string
  name: string
  html_url: string
  description: string | null
  private: boolean
  fork: boolean
  default_branch: string
  language: string | null
  topics?: string[]
  open_issues_count: number
  stargazers_count: number
  updated_at: string
  parent?: { full_name: string }
}

interface RepositorySummary {
  fullName: string
  name: string
  htmlUrl: string
  description: string | null
  private: boolean
  fork: boolean
  forkParent: string | null
  defaultBranch: string
  language: string | null
  topics: string[]
  openIssuesCount: number
  stars: number
  updatedAt: string
}

interface RepositoryAnalysis extends RepositorySummary {
  languages: Record<string, number>
  hasWorkflows: boolean
}

class GitHubRequestError extends Error {
  constructor(readonly status: number) {
    super('GitHub API request failed.')
  }
}

function isValidFullName(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 200) return false
  const [owner, repository, ...extra] = value.split('/')
  return extra.length === 0
    && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(owner || '')
    && /^[A-Za-z0-9_.-]+$/.test(repository || '')
}

async function githubGet<T>(
  path: string,
  token: string,
  options: { allowNotFound?: boolean } = {},
): Promise<T | null> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (options.allowNotFound && response.status === 404) return null
  if (!response.ok) throw new GitHubRequestError(response.status)
  return await response.json() as T
}

function toRepositorySummary(repository: GitHubRepository): RepositorySummary {
  return {
    fullName: repository.full_name,
    name: repository.name,
    htmlUrl: repository.html_url,
    description: repository.description,
    private: repository.private,
    fork: repository.fork,
    forkParent: repository.parent?.full_name ?? null,
    defaultBranch: repository.default_branch,
    language: repository.language,
    topics: repository.topics ?? [],
    openIssuesCount: repository.open_issues_count,
    stars: repository.stargazers_count,
    updatedAt: repository.updated_at,
  }
}

async function analyzeRepository(fullName: string, token: string): Promise<RepositoryAnalysis> {
  const [repository, languages] = await Promise.all([
    githubGet<GitHubRepository>(`/repos/${fullName}`, token),
    githubGet<Record<string, number>>(`/repos/${fullName}/languages`, token),
  ])
  if (!repository || !languages) throw new GitHubRequestError(502)

  const workflows = await githubGet<unknown[]>(
    `/repos/${fullName}/contents/.github/workflows?ref=${encodeURIComponent(repository.default_branch)}`,
    token,
    { allowNotFound: true },
  )

  return {
    ...toRepositorySummary(repository),
    languages,
    hasWorkflows: Array.isArray(workflows) && workflows.length > 0,
  }
}

function sendGitHubError(res: VercelResponse, error: unknown): void {
  if (error instanceof GitHubRequestError) {
    if (error.status === 401) {
      res.status(403).json({ error: 'GitHub access expired. Reconnect your GitHub repository access.' })
    } else if (error.status === 403) {
      res.status(429).json({ error: 'GitHub rate limit or permission limit reached. Please try again later.' })
    } else if (error.status === 404) {
      res.status(404).json({ error: 'That repository is no longer available to this GitHub account.' })
    } else {
      res.status(502).json({ error: 'GitHub could not load repository details. Please try again.' })
    }
    return
  }
  res.status(500).json({ error: 'Repository access could not be loaded. Please try again.' })
}

async function handleRepositoryAction(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'Please sign in to manage repository access.' })

  const action = req.query.action
  if (typeof action !== 'string') return res.status(400).json({ error: 'Missing repository action.' })

  try {
    if (action === 'status') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
      const token = await getGitHubRepositoryToken(userId)
      const repository = token ? await getSelectedGitHubRepository(userId) : null
      return res.status(200).json({ connected: !!token, selectedRepository: repository })
    }

    if (action === 'list') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
      const token = await getGitHubRepositoryToken(userId)
      if (!token) return res.status(403).json({ error: 'Connect GitHub repository access first.' })
      const repositories = await githubGet<GitHubRepository[]>(
        '/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&per_page=100',
        token,
      )
      return res.status(200).json({
        repositories: (repositories ?? []).map(repository => ({
          fullName: repository.full_name,
          name: repository.name,
          private: repository.private,
          description: repository.description,
          language: repository.language,
          updatedAt: repository.updated_at,
        })),
      })
    }

    if (action === 'selected') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
      const token = await getGitHubRepositoryToken(userId)
      if (!token) return res.status(403).json({ error: 'Connect GitHub repository access first.' })
      const fullName = await getSelectedGitHubRepository(userId)
      if (!fullName) return res.status(200).json({ repository: null })
      if (!isValidFullName(fullName)) {
        return res.status(500).json({ error: 'Stored repository selection is invalid. Choose a repository again.' })
      }
      return res.status(200).json({ repository: await analyzeRepository(fullName, token) })
    }

    if (action === 'select') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
      const { fullName } = (req.body || {}) as { fullName?: unknown }
      if (!isValidFullName(fullName)) {
        return res.status(400).json({ error: 'Choose a repository from your GitHub account.' })
      }
      const token = await getGitHubRepositoryToken(userId)
      if (!token) return res.status(403).json({ error: 'Connect GitHub repository access first.' })
      const repository = await analyzeRepository(fullName, token)
      const saved = await saveSelectedGitHubRepository(userId, repository.fullName)
      if (!saved) return res.status(503).json({ error: 'Could not save your selected repository. Please try again.' })
      return res.status(200).json({ repository })
    }

    if (action === 'disconnect') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
      const deleted = await disconnectGitHubRepositoryAccess(userId)
      if (!deleted) return res.status(503).json({ error: 'Could not remove GitHub repository access. Please try again.' })
      return res.status(200).json({ connected: false, selectedRepository: null })
    }

    return res.status(404).json({ error: 'Unknown repository action.' })
  } catch (error) {
    sendGitHubError(res, error)
  }
}

export default handleRepositoryAction

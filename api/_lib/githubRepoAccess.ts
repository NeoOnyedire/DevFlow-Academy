import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { getUpstashConfig, upstashDel, upstashGet, upstashSet } from './upstash.js'

const TOKEN_KEY_PREFIX = 'devflow:github-repo-token:'
const SELECTED_REPOSITORY_KEY_PREFIX = 'devflow:selected-github-repo:'

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not configured on the server.')
  return createHash('sha256').update('devflow-github-repository-token-v1\0').update(secret).digest()
}

function requireStorage(): void {
  if (!getUpstashConfig()) throw new Error('Repository access storage is not configured on the server.')
}

export async function saveGitHubRepositoryToken(userId: string, token: string): Promise<boolean> {
  requireStorage()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const record = JSON.stringify({
    version: 1,
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
    data: encrypted.toString('base64url'),
  })
  return upstashSet(`${TOKEN_KEY_PREFIX}${userId}`, record)
}

export async function getGitHubRepositoryToken(userId: string): Promise<string | null> {
  requireStorage()
  const record = await upstashGet(`${TOKEN_KEY_PREFIX}${userId}`)
  if (!record) return null

  const parsed = JSON.parse(record) as { version?: number; iv?: string; tag?: string; data?: string }
  if (parsed.version !== 1 || !parsed.iv || !parsed.tag || !parsed.data) {
    throw new Error('Stored GitHub repository access data is invalid.')
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(parsed.iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(parsed.tag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.data, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

export async function getSelectedGitHubRepository(userId: string): Promise<string | null> {
  requireStorage()
  return upstashGet(`${SELECTED_REPOSITORY_KEY_PREFIX}${userId}`)
}

export async function saveSelectedGitHubRepository(userId: string, fullName: string): Promise<boolean> {
  requireStorage()
  return upstashSet(`${SELECTED_REPOSITORY_KEY_PREFIX}${userId}`, fullName)
}

export async function disconnectGitHubRepositoryAccess(userId: string): Promise<boolean> {
  requireStorage()
  const tokenDeleted = await upstashDel(`${TOKEN_KEY_PREFIX}${userId}`)
  const repositoryDeleted = await upstashDel(`${SELECTED_REPOSITORY_KEY_PREFIX}${userId}`)
  return tokenDeleted && repositoryDeleted
}

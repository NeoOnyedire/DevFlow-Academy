import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '../api/_lib/vercel'

const mocks = vi.hoisted(() => ({
  createPasswordUser: vi.fn(),
  toSafeUser: vi.fn(),
  getUserByEmail: vi.fn(),
  verifyPassword: vi.fn(),
  getUserById: vi.fn(),
  saveUser: vi.fn(),
  hashPassword: vi.fn(),
  upsertGithubUser: vi.fn(),
  createSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  getUserIdFromRequest: vi.fn(),
  createVerificationToken: vi.fn(),
  consumeVerificationToken: vi.fn(),
  createResetToken: vi.fn(),
  consumeResetToken: vi.fn(),
  sendEmail: vi.fn(),
  buildVerificationEmail: vi.fn(),
  buildPasswordResetEmail: vi.fn(),
  buildGithubAccountNoticeEmail: vi.fn(),
  isRateLimited: vi.fn(),
  requireAdmin: vi.fn(),
  sql: vi.fn(),
  getAllUsers: vi.fn(),
  deleteUser: vi.fn(),
  backfillAllUsersSet: vi.fn(),
  getUpstashConfig: vi.fn(),
  upstashLRem: vi.fn(),
  upstashLLen: vi.fn(),
}))

vi.mock('../api/_lib/users.js', () => ({
  createPasswordUser: mocks.createPasswordUser,
  toSafeUser: mocks.toSafeUser,
  getUserByEmail: mocks.getUserByEmail,
  verifyPassword: mocks.verifyPassword,
  getUserById: mocks.getUserById,
  saveUser: mocks.saveUser,
  hashPassword: mocks.hashPassword,
  upsertGithubUser: mocks.upsertGithubUser,
  getAllUsers: mocks.getAllUsers,
  deleteUser: mocks.deleteUser,
  backfillAllUsersSet: mocks.backfillAllUsersSet,
}))
vi.mock('../api/_lib/session.js', () => ({
  createSessionCookie: mocks.createSessionCookie,
  clearSessionCookie: mocks.clearSessionCookie,
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))
vi.mock('../api/_lib/tokens.js', () => ({
  createVerificationToken: mocks.createVerificationToken,
  consumeVerificationToken: mocks.consumeVerificationToken,
  createResetToken: mocks.createResetToken,
  consumeResetToken: mocks.consumeResetToken,
}))
vi.mock('../api/_lib/mail.js', () => ({
  sendEmail: mocks.sendEmail,
  buildVerificationEmail: mocks.buildVerificationEmail,
  buildPasswordResetEmail: mocks.buildPasswordResetEmail,
  buildGithubAccountNoticeEmail: mocks.buildGithubAccountNoticeEmail,
}))
vi.mock('../api/_lib/rateLimit.js', () => ({ isRateLimited: mocks.isRateLimited }))
vi.mock('../api/_lib/admin.js', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('../api/_lib/db.js', () => ({ sql: mocks.sql }))
vi.mock('../api/_lib/upstash.js', () => ({
  getUpstashConfig: mocks.getUpstashConfig,
  upstashLRem: mocks.upstashLRem,
  upstashLLen: mocks.upstashLLen,
}))

import authHandler from '../api/auth/[action].js'
import adminHandler from '../api/admin/[action].js'

function createRequest(method: string, action: string, body?: unknown): VercelRequest {
  return {
    method,
    query: { action },
    body,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as VercelRequest
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
      return this
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.sql.mockResolvedValue({ rows: [] })
  mocks.requireAdmin.mockResolvedValue({ id: 'admin-1', name: 'Admin' })
  mocks.getUserById.mockResolvedValue({
    id: 'user-1',
    name: 'Ada',
    email: 'ada@example.com',
    passwordHash: 'secret-hash',
    provider: 'password',
  })
  mocks.toSafeUser.mockImplementation((user: { passwordHash?: string }) => {
    const { passwordHash: _passwordHash, ...safeUser } = user
    return safeUser
  })
  mocks.getUserByEmail.mockResolvedValue({
    id: 'user-1',
    name: 'Ada',
    email: 'ada@example.com',
    passwordHash: 'secret-hash',
    provider: 'password',
  })
  mocks.verifyPassword.mockReturnValue(true)
  mocks.createSessionCookie.mockReturnValue('devflow_session=test; HttpOnly')
  mocks.deleteUser.mockResolvedValue(true)
})

describe('auth API route', () => {
  it('rejects login requests without credentials', async () => {
    const response = createResponse()
    await authHandler(createRequest('POST', 'login', { email: '' }), response as unknown as VercelResponse)

    expect(response.statusCode).toBe(400)
    expect(mocks.getUserByEmail).not.toHaveBeenCalled()
  })

  it('returns a safe user and session cookie after a successful login', async () => {
    const response = createResponse()
    await authHandler(
      createRequest('POST', 'login', { email: ' ADA@EXAMPLE.COM ', password: 'password123' }),
      response as unknown as VercelResponse,
    )

    expect(response.statusCode).toBe(200)
    expect(mocks.getUserByEmail).toHaveBeenCalledWith('ada@example.com')
    expect(response.headers['Set-Cookie']).toContain('HttpOnly')
    expect(response.body).toEqual({ user: expect.not.objectContaining({ passwordHash: expect.anything() }) })
  })

  it('rejects invalid credentials without creating a session', async () => {
    mocks.verifyPassword.mockReturnValueOnce(false)
    const response = createResponse()
    await authHandler(
      createRequest('POST', 'login', { email: 'ada@example.com', password: 'wrong-password' }),
      response as unknown as VercelResponse,
    )

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid email or password. Try registering first!' })
    expect(response.headers['Set-Cookie']).toBeUndefined()
  })

  it('returns a clear error if account storage is unavailable during login', async () => {
    mocks.getUserByEmail.mockRejectedValueOnce(new Error('storage unavailable'))
    const response = createResponse()
    await authHandler(
      createRequest('POST', 'login', { email: 'ada@example.com', password: 'password123' }),
      response as unknown as VercelResponse,
    )

    expect(response.statusCode).toBe(500)
    expect(response.body).toEqual({ error: 'Could not reach account storage. Please try again.' })
    expect(response.headers['Set-Cookie']).toBeUndefined()
  })
})

describe('admin API route', () => {
  it('blocks requests that do not pass the server-side admin check', async () => {
    mocks.requireAdmin.mockResolvedValueOnce(null)
    const response = createResponse()
    await adminHandler(createRequest('GET', 'users'), response as unknown as VercelResponse)

    expect(response.statusCode).toBe(403)
    expect(mocks.getAllUsers).not.toHaveBeenCalled()
    expect(mocks.sql).not.toHaveBeenCalled()
  })

  it('cleans dependent database rows and deletes the Redis account', async () => {
    const response = createResponse()
    await adminHandler(
      createRequest('POST', 'delete-account', { userId: 'user-1' }),
      response as unknown as VercelResponse,
    )

    expect(response.statusCode).toBe(200)
    expect(mocks.sql).toHaveBeenCalledTimes(4)
    expect(mocks.deleteUser).toHaveBeenCalledWith('user-1')
    expect(response.body).toEqual({ ok: true })
  })

  it('allows a retry to clean database rows if the Redis account is already gone', async () => {
    mocks.getUserById.mockResolvedValueOnce(null)
    const response = createResponse()
    await adminHandler(
      createRequest('POST', 'delete-account', { userId: 'user-1' }),
      response as unknown as VercelResponse,
    )

    expect(response.statusCode).toBe(200)
    expect(mocks.sql).toHaveBeenCalledTimes(4)
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })
})

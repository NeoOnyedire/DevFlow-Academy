import { describe, it, expect, beforeAll } from 'vitest'
import type { VercelRequest } from '@vercel/node'
import { createHmac } from 'crypto'
import {
  createSessionCookie,
  clearSessionCookie,
  getUserIdFromRequest,
} from '../api/_lib/session.js'

// getSecret() reads process.env.SESSION_SECRET lazily on each call, so it's
// safe to set this before the test suite runs rather than mocking the module.
beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-prod'
})

/** Builds a minimal fake VercelRequest carrying just a Cookie header. */
function fakeRequest(cookieHeader?: string): VercelRequest {
  return { headers: cookieHeader ? { cookie: cookieHeader } : {} } as unknown as VercelRequest
}

/** Extracts the `devflow_session=<value>` cookie pair out of a Set-Cookie string. */
function extractCookiePair(setCookieHeader: string): string {
  return setCookieHeader.split(';')[0]
}

describe('createSessionCookie', () => {
  it('produces a Set-Cookie string with the expected security attributes', () => {
    const header = createSessionCookie('user-123')
    expect(header).toContain('devflow_session=')
    expect(header).toContain('HttpOnly')
    expect(header).toContain('Path=/')
    expect(header).toContain('SameSite=Lax')
    expect(header).toContain(`Max-Age=${60 * 60 * 24 * 30}`)
  })

  it('includes Secure unless VERCEL_ENV is development', () => {
    const original = process.env.VERCEL_ENV

    process.env.VERCEL_ENV = 'production'
    expect(createSessionCookie('user-123')).toContain('Secure')

    process.env.VERCEL_ENV = 'development'
    expect(createSessionCookie('user-123')).not.toContain('Secure')

    process.env.VERCEL_ENV = original
  })

  it('throws if SESSION_SECRET is not configured', () => {
    const original = process.env.SESSION_SECRET
    delete process.env.SESSION_SECRET

    expect(() => createSessionCookie('user-123')).toThrow(/SESSION_SECRET/)

    process.env.SESSION_SECRET = original
  })
})

describe('clearSessionCookie', () => {
  it('produces a cookie that expires immediately', () => {
    const header = clearSessionCookie()
    expect(header).toContain('devflow_session=;')
    expect(header).toContain('Max-Age=0')
  })
})

describe('getUserIdFromRequest', () => {
  it('returns null when there is no cookie header at all', () => {
    expect(getUserIdFromRequest(fakeRequest())).toBeNull()
  })

  it('returns null when the devflow_session cookie is missing among others', () => {
    const req = fakeRequest('other_cookie=abc; another=def')
    expect(getUserIdFromRequest(req)).toBeNull()
  })

  it('round-trips a valid session cookie back to the original user id', () => {
    const setCookie = createSessionCookie('user-abc-123')
    const req = fakeRequest(extractCookiePair(setCookie))
    expect(getUserIdFromRequest(req)).toBe('user-abc-123')
  })

  it('works when other cookies are present alongside the session cookie', () => {
    const setCookie = createSessionCookie('user-abc-123')
    const req = fakeRequest(`theme=dark; ${extractCookiePair(setCookie)}; other=1`)
    expect(getUserIdFromRequest(req)).toBe('user-abc-123')
  })

  it('rejects a cookie whose signature has been tampered with', () => {
    const setCookie = createSessionCookie('user-abc-123')
    const pair = extractCookiePair(setCookie)
    const [name, token] = pair.split('=')
    const [body, sig] = token.split('.')
    // Flip the signature so it no longer matches the body.
    const tamperedSig = sig.slice(0, -1) + (sig.at(-1) === 'A' ? 'B' : 'A')
    const req = fakeRequest(`${name}=${body}.${tamperedSig}`)
    expect(getUserIdFromRequest(req)).toBeNull()
  })

  it('rejects a cookie whose payload has been tampered with (still fails signature check)', () => {
    const setCookie = createSessionCookie('user-abc-123')
    const pair = extractCookiePair(setCookie)
    const [name, token] = pair.split('=')
    const [, sig] = token.split('.')
    const forgedBody = Buffer.from(JSON.stringify({ uid: 'someone-else', exp: Date.now() + 1e9 })).toString('base64url')
    const req = fakeRequest(`${name}=${forgedBody}.${sig}`)
    expect(getUserIdFromRequest(req)).toBeNull()
  })

  it('rejects an expired session', () => {
    // Build a token whose exp is already in the past — no need for fake
    // timers since we control the payload directly.
    const payload = { uid: 'user-abc-123', exp: Date.now() - 1000 }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const sig = createHmac('sha256', process.env.SESSION_SECRET as string).update(body).digest('base64url')
    const req = fakeRequest(`devflow_session=${body}.${sig}`)
    expect(getUserIdFromRequest(req)).toBeNull()
  })

  it('rejects a malformed token missing the signature segment', () => {
    const req = fakeRequest('devflow_session=onlyonepart')
    expect(getUserIdFromRequest(req)).toBeNull()
  })

  it('rejects a token whose body is not valid base64url JSON', () => {
    const req = fakeRequest('devflow_session=not-valid-base64!!!.somesig')
    expect(getUserIdFromRequest(req)).toBeNull()
  })

  it('rejects a payload with a non-string uid', () => {
    const payload = { uid: 12345, exp: Date.now() + 1e9 }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const sig = createHmac('sha256', process.env.SESSION_SECRET as string).update(body).digest('base64url')
    const req = fakeRequest(`devflow_session=${body}.${sig}`)
    expect(getUserIdFromRequest(req)).toBeNull()
  })
})

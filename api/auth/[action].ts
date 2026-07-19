// api/auth/[action].ts
//
// All auth endpoints consolidated into ONE serverless function, dispatched
// by the `action` path segment. Vercel's dynamic route syntax means a
// request to /api/auth/login lands here with req.query.action === 'login'
// automatically — no frontend changes needed, since AuthContext.tsx
// already calls those exact URLs.
//
// WHY THIS FILE EXISTS: Vercel's Hobby plan caps a deployment at 12
// Serverless Functions. Each file directly under api/ (excluding
// api/_lib, which is skipped) counts as one function. Nine separate
// auth files (login, logout, me, register, github, verify-email,
// reset-password, request-password-reset, resend-verification) plus
// gitter, leaderboard, progress, and reviews added up to 13 — one over
// the limit. Consolidating auth into a single dynamic-route function
// drops the total to 5, with headroom for future endpoints.
//
// Each action's logic below is otherwise unchanged from its original
// standalone file — only the export shape changed (named function +
// dispatch, instead of a default export per file).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createPasswordUser, toSafeUser, getUserByEmail, verifyPassword,
  getUserById, saveUser, hashPassword, upsertGithubUser,
} from '../_lib/users.js'
import { createSessionCookie, clearSessionCookie, getUserIdFromRequest } from '../_lib/session.js'
import { createVerificationToken, consumeVerificationToken, createResetToken, consumeResetToken } from '../_lib/tokens.js'
import { sendEmail, buildVerificationEmail, buildPasswordResetEmail, buildGithubAccountNoticeEmail } from '../_lib/mail.js'
import { isRateLimited } from '../_lib/rateLimit.js'

function getBaseUrl(req: VercelRequest): string {
  const host = req.headers.host
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  return `${proto}://${host}`
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  return (
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

// ---- login ----
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = (req.body || {}) as { email?: string; password?: string }
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Please enter your email and password.' })
  }

  try {
    const user = await getUserByEmail(email.trim().toLowerCase())
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password. Try registering first!' })
    }
    res.setHeader('Set-Cookie', createSessionCookie(user.id))
    res.status(200).json({ user: toSafeUser(user) })
  } catch {
    res.status(500).json({ error: 'Could not reach account storage. Please try again.' })
  }
}

// ---- logout ----
async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Set-Cookie', clearSessionCookie())
  res.status(200).json({ ok: true })
}

// ---- me ----
async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(200).json({ user: null })

  try {
    const user = await getUserById(userId)
    res.status(200).json({ user: user ? toSafeUser(user) : null })
  } catch {
    res.status(200).json({ user: null })
  }
}

// ---- register ----
async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, password } = (req.body || {}) as { name?: string; email?: string; password?: string }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Please enter your name.' })
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email.' })
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    const user = await createPasswordUser(name.trim(), email.trim().toLowerCase(), password)
    if (!user) return res.status(409).json({ error: 'An account with this email already exists.' })

    res.setHeader('Set-Cookie', createSessionCookie(user.id))
    res.status(200).json({ user: toSafeUser(user) })

    try {
      const token = await createVerificationToken(user.id)
      const link = `${getBaseUrl(req)}/verify-email?token=${token}`
      const { subject, html } = buildVerificationEmail(link)
      await sendEmail(user.email, subject, html)
    } catch {
      // Best-effort — account still works either way.
    }
  } catch {
    res.status(500).json({ error: 'Account storage is not configured on the server yet.' })
  }
}

// ---- github ----
interface GitHubTokenResponse { access_token?: string; error?: string; error_description?: string }
interface GitHubUser { id: number; login: string; name: string | null; avatar_url: string; email: string | null; html_url: string }
interface GitHubEmail { email: string; primary: boolean; verified: boolean }

async function handleGithub(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = (req.body || {}) as { code?: string }
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Missing authorization code' })

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'GitHub OAuth is not configured on the server.' })
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    })

    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse
    if (!tokenData.access_token) {
      return res.status(401).json({
        error: 'GITHUB_AUTH_FAILED',
        message: tokenData.error_description || 'GitHub rejected that authorization code.',
      })
    }

    const accessToken = tokenData.access_token

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
    })
    if (!userResponse.ok) return res.status(502).json({ error: 'Could not load GitHub profile.' })

    const githubUser = (await userResponse.json()) as GitHubUser

    let email = githubUser.email
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
      })
      if (emailResponse.ok) {
        const emails = (await emailResponse.json()) as GitHubEmail[]
        email = emails.find(e => e.primary && e.verified)?.email ?? emails.find(e => e.verified)?.email ?? null
      }
    }

    const user = await upsertGithubUser({
      githubId: githubUser.id,
      username: githubUser.login,
      name: githubUser.name || githubUser.login,
      email: email || `${githubUser.login}@users.noreply.github.com`,
      avatarUrl: githubUser.avatar_url,
    })

    res.setHeader('Set-Cookie', createSessionCookie(user.id))
    res.status(200).json({ user: toSafeUser(user) })
  } catch {
    res.status(502).json({ error: 'Failed to reach GitHub. Please try again.' })
  }
}

// ---- request-password-reset ----
const GENERIC_RESET_MESSAGE = "If that email has an account, we've sent a link to reset the password."

async function handleRequestPasswordReset(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = (req.body || {}) as { email?: string }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email.' })
  }

  if (isRateLimited(`reset-request:${getClientIp(req)}`, 15 * 60 * 1000, 5)) {
    return res.status(200).json({ ok: true, message: GENERIC_RESET_MESSAGE })
  }

  try {
    const user = await getUserByEmail(email.trim().toLowerCase())

    if (user && user.provider === 'password') {
      const token = await createResetToken(user.id)
      const link = `${getBaseUrl(req)}/reset-password?token=${token}`
      const { subject, html } = buildPasswordResetEmail(link)
      await sendEmail(user.email, subject, html)
    } else if (user && user.provider === 'github') {
      const { subject, html } = buildGithubAccountNoticeEmail()
      await sendEmail(user.email, subject, html)
    }

    res.status(200).json({ ok: true, message: GENERIC_RESET_MESSAGE })
  } catch {
    res.status(200).json({ ok: true, message: GENERIC_RESET_MESSAGE })
  }
}

// ---- resend-verification ----
async function handleResendVerification(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const userId = getUserIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'Please log in first.' })

  if (isRateLimited(`resend-verify:${userId}`, 10 * 60 * 1000, 3)) {
    return res.status(429).json({ error: 'Please wait a few minutes before requesting another email.' })
  }

  try {
    const user = await getUserById(userId)
    if (!user) return res.status(401).json({ error: 'Your session has expired. Please log in again.' })
    if (user.emailVerified) return res.status(200).json({ ok: true, message: 'Your email is already verified.' })

    const token = await createVerificationToken(user.id)
    const link = `${getBaseUrl(req)}/verify-email?token=${token}`
    const { subject, html } = buildVerificationEmail(link)
    const sent = await sendEmail(user.email, subject, html)

    if (!sent) return res.status(502).json({ error: 'Could not send the email right now. Please try again shortly.' })
    res.status(200).json({ ok: true, message: 'Verification email sent — check your inbox.' })
  } catch {
    res.status(502).json({ error: 'Could not send the email right now. Please try again shortly.' })
  }
}

// ---- reset-password ----
async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token, newPassword } = (req.body || {}) as { token?: string; newPassword?: string }
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Missing reset token.' })
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    const userId = await consumeResetToken(token)
    if (!userId) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' })
    }

    const user = await getUserById(userId)
    if (!user || user.provider !== 'password') {
      return res.status(400).json({ error: 'This reset link is no longer valid.' })
    }

    user.passwordHash = hashPassword(newPassword)
    await saveUser(user)

    res.setHeader('Set-Cookie', createSessionCookie(user.id))
    res.status(200).json({ user: toSafeUser(user) })
  } catch {
    res.status(502).json({ error: 'Could not reset your password right now. Please try again.' })
  }
}

// ---- verify-email ----
async function handleVerifyEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token } = (req.body || {}) as { token?: string }
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Missing verification token.' })

  try {
    const userId = await consumeVerificationToken(token)
    if (!userId) return res.status(400).json({ error: 'This verification link is invalid or has expired.' })

    const user = await getUserById(userId)
    if (!user) return res.status(400).json({ error: 'This account no longer exists.' })

    user.emailVerified = true
    await saveUser(user)

    res.status(200).json({ ok: true, user: toSafeUser(user) })
  } catch {
    res.status(502).json({ error: 'Could not verify your email right now. Please try again.' })
  }
}

// ---- dispatch ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = typeof req.query.action === 'string' ? req.query.action : ''

  switch (action) {
    case 'login': return handleLogin(req, res)
    case 'logout': return handleLogout(req, res)
    case 'me': return handleMe(req, res)
    case 'register': return handleRegister(req, res)
    case 'github': return handleGithub(req, res)
    case 'request-password-reset': return handleRequestPasswordReset(req, res)
    case 'resend-verification': return handleResendVerification(req, res)
    case 'reset-password': return handleResetPassword(req, res)
    case 'verify-email': return handleVerifyEmail(req, res)
    default:
      res.status(404).json({ error: 'Unknown auth action.' })
  }
}

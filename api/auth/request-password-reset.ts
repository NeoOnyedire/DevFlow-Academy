// api/auth/request-password-reset.ts
//
// Starts a password reset. Always responds with the same generic
// success message regardless of whether the email belongs to an
// account, a password account, or a GitHub account — this avoids
// leaking which emails are registered (a common enumeration attack
// surface for "forgot password" flows).
//
// - Email matches a password account -> sends a reset link.
// - Email matches a GitHub-only account -> sends a short "you sign in
//   with GitHub, nothing to reset" notice instead (still helpful, still
//   only visible to whoever actually owns that inbox).
// - Email matches nothing -> no email sent, same response either way.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUserByEmail } from '../_lib/users.js'
import { createResetToken } from '../_lib/tokens.js'
import { sendEmail, buildPasswordResetEmail, buildGithubAccountNoticeEmail } from '../_lib/mail.js'
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

const GENERIC_MESSAGE = "If that email has an account, we've sent a link to reset the password."

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email } = (req.body || {}) as { email?: string }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Please enter a valid email.' })
    return
  }

  // Rate-limit by IP so this can't be used to spam an inbox or probe accounts fast.
  if (isRateLimited(`reset-request:${getClientIp(req)}`, 15 * 60 * 1000, 5)) {
    res.status(200).json({ ok: true, message: GENERIC_MESSAGE })
    return
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
    // No user found: intentionally do nothing, same response below.

    res.status(200).json({ ok: true, message: GENERIC_MESSAGE })
  } catch {
    // Even on internal errors, don't reveal anything — just tell them to check email.
    res.status(200).json({ ok: true, message: GENERIC_MESSAGE })
  }
}

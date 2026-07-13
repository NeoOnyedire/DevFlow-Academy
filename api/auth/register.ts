// api/auth/register.ts
//
// Creates a real, server-side password account (see api/_lib/users.ts),
// signs the person in immediately with an httpOnly session cookie, and
// sends a verification email in the background (best-effort — a mail
// provider hiccup should never block signup).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createPasswordUser, toSafeUser } from '../_lib/users'
import { createSessionCookie } from '../_lib/session'
import { createVerificationToken } from '../_lib/tokens'
import { sendEmail, buildVerificationEmail } from '../_lib/mail'

function getBaseUrl(req: VercelRequest): string {
  const host = req.headers.host
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  return `${proto}://${host}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { name, email, password } = (req.body || {}) as { name?: string; email?: string; password?: string }

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Please enter your name.' })
    return
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Please enter a valid email.' })
    return
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' })
    return
  }

  try {
    const user = await createPasswordUser(name.trim(), email.trim().toLowerCase(), password)
    if (!user) {
      res.status(409).json({ error: 'An account with this email already exists.' })
      return
    }

    res.setHeader('Set-Cookie', createSessionCookie(user.id))
    res.status(200).json({ user: toSafeUser(user) })

    // Fire-and-forget: don't make the person wait on email delivery.
    try {
      const token = await createVerificationToken(user.id)
      const link = `${getBaseUrl(req)}/verify-email?token=${token}`
      const { subject, html } = buildVerificationEmail(link)
      await sendEmail(user.email, subject, html)
    } catch {
      // Best-effort — the account still works, they can request another
      // verification email later from the banner.
    }
  } catch {
    res.status(500).json({ error: 'Account storage is not configured on the server yet.' })
  }
}

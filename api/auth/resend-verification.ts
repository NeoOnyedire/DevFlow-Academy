// api/auth/resend-verification.ts
//
// Lets the currently signed-in person request another verification
// email (used by the "Resend email" button on the verification banner).
// Requires a valid session — this only ever sends to the account's own
// email, never an arbitrary address someone types in.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUserIdFromRequest } from '../_lib/session.js'
import { getUserById } from '../_lib/users.js'
import { createVerificationToken } from '../_lib/tokens.js'
import { sendEmail, buildVerificationEmail } from '../_lib/mail.js'
import { isRateLimited } from '../_lib/rateLimit.js'

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

  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Please log in first.' })
    return
  }

  // Max 3 resend requests per account per 10 minutes.
  if (isRateLimited(`resend-verify:${userId}`, 10 * 60 * 1000, 3)) {
    res.status(429).json({ error: 'Please wait a few minutes before requesting another email.' })
    return
  }

  try {
    const user = await getUserById(userId)
    if (!user) {
      res.status(401).json({ error: 'Your session has expired. Please log in again.' })
      return
    }
    if (user.emailVerified) {
      res.status(200).json({ ok: true, message: 'Your email is already verified.' })
      return
    }

    const token = await createVerificationToken(user.id)
    const link = `${getBaseUrl(req)}/verify-email?token=${token}`
    const { subject, html } = buildVerificationEmail(link)
    const sent = await sendEmail(user.email, subject, html)

    if (!sent) {
      res.status(502).json({ error: 'Could not send the email right now. Please try again shortly.' })
      return
    }

    res.status(200).json({ ok: true, message: 'Verification email sent — check your inbox.' })
  } catch {
    res.status(502).json({ error: 'Could not send the email right now. Please try again shortly.' })
  }
}

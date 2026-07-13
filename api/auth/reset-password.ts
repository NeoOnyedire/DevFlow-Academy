// api/auth/reset-password.ts
//
// Consumes a password reset token (from the emailed link), sets a new
// (hashed) password on the account, and signs the person straight in.
// Tokens are single-use and expire after 1 hour (see api/_lib/tokens.ts).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { consumeResetToken } from '../_lib/tokens'
import { getUserById, saveUser, hashPassword, toSafeUser } from '../_lib/users'
import { createSessionCookie } from '../_lib/session'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { token, newPassword } = (req.body || {}) as { token?: string; newPassword?: string }

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Missing reset token.' })
    return
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' })
    return
  }

  try {
    const userId = await consumeResetToken(token)
    if (!userId) {
      res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' })
      return
    }

    const user = await getUserById(userId)
    if (!user || user.provider !== 'password') {
      res.status(400).json({ error: 'This reset link is no longer valid.' })
      return
    }

    user.passwordHash = hashPassword(newPassword)
    await saveUser(user)

    res.setHeader('Set-Cookie', createSessionCookie(user.id))
    res.status(200).json({ user: toSafeUser(user) })
  } catch {
    res.status(502).json({ error: 'Could not reset your password right now. Please try again.' })
  }
}

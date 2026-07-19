// api/auth/verify-email.ts
//
// Consumes a verification token (from the emailed link) and marks the
// matching account's email as verified. Tokens are single-use and
// expire after 24 hours (see api/_lib/tokens.ts).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { consumeVerificationToken } from '../_lib/tokens.js'
import { getUserById, saveUser, toSafeUser } from '../_lib/users.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { token } = (req.body || {}) as { token?: string }
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Missing verification token.' })
    return
  }

  try {
    const userId = await consumeVerificationToken(token)
    if (!userId) {
      res.status(400).json({ error: 'This verification link is invalid or has expired.' })
      return
    }

    const user = await getUserById(userId)
    if (!user) {
      res.status(400).json({ error: 'This account no longer exists.' })
      return
    }

    user.emailVerified = true
    await saveUser(user)

    res.status(200).json({ ok: true, user: toSafeUser(user) })
  } catch {
    res.status(502).json({ error: 'Could not verify your email right now. Please try again.' })
  }
}

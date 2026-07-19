// api/auth/login.ts
//
// Verifies email + password against the server-side account and signs
// the person in with an httpOnly session cookie.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUserByEmail, verifyPassword, toSafeUser } from '../_lib/users.js'
import { createSessionCookie } from '../_lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { email, password } = (req.body || {}) as { email?: string; password?: string }

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    res.status(400).json({ error: 'Please enter your email and password.' })
    return
  }

  try {
    const user = await getUserByEmail(email.trim().toLowerCase())
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password. Try registering first!' })
      return
    }

    res.setHeader('Set-Cookie', createSessionCookie(user.id))
    res.status(200).json({ user: toSafeUser(user) })
  } catch {
    res.status(500).json({ error: 'Could not reach account storage. Please try again.' })
  }
}

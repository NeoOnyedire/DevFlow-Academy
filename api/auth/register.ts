// api/auth/register.ts
//
// Creates a real, server-side password account (see api/_lib/users.ts)
// and signs the person in with an httpOnly session cookie. Replaces the
// old client-side `devflow_users` localStorage array — passwords are
// hashed (scrypt) before they're ever written to storage.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createPasswordUser, toSafeUser } from '../_lib/users'
import { createSessionCookie } from '../_lib/session'

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
  } catch {
    res.status(500).json({ error: 'Account storage is not configured on the server yet.' })
  }
}

// api/auth/me.ts
//
// "Who is the current session cookie signed in as, if anyone?" — called
// once on app load (see AuthContext.tsx) so the client's idea of "am I
// logged in" is a real, server-verified fact rather than whatever was
// last cached in localStorage.
//
// Always returns 200 (even when logged out) with `{ user: null }` — this
// is a normal, expected state, not an error.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUserIdFromRequest } from '../_lib/session'
import { getUserById, toSafeUser } from '../_lib/users'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(200).json({ user: null })
    return
  }

  try {
    const user = await getUserById(userId)
    res.status(200).json({ user: user ? toSafeUser(user) : null })
  } catch {
    // If storage is unreachable, fail "logged out" rather than erroring —
    // the person can just log in again.
    res.status(200).json({ user: null })
  }
}

// api/auth/logout.ts
//
// Clears the session cookie. Nothing server-side needs to be deleted —
// the cookie is the only place the session lives, so clearing it is
// sufficient to end the session.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookie } from '../_lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.setHeader('Set-Cookie', clearSessionCookie())
  res.status(200).json({ ok: true })
}

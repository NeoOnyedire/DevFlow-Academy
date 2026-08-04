// api/_lib/admin.ts
//
// Single-admin gate. Only the account signed in via GitHub as
// ADMIN_GITHUB_USERNAME may call anything under api/admin/*. This is
// enforced server-side by re-reading the session cookie -> real user
// record on every request — there's no client-side way to fake it.

import type { VercelRequest } from '@vercel/node'
import { getUserIdFromRequest } from './session.js'
import { getUserById, type StoredUser } from './users.js'

// Override with an env var if you ever want to change the admin account
// without a redeploy. Defaults to your GitHub username.
const ADMIN_GITHUB_USERNAME = (process.env.ADMIN_GITHUB_USERNAME || 'NeoOnyedire').toLowerCase()

/** Returns the admin's StoredUser if this request is authenticated as them, else null. */
export async function requireAdmin(req: VercelRequest): Promise<StoredUser | null> {
  const userId = getUserIdFromRequest(req)
  if (!userId) return null

  const user = await getUserById(userId)
  if (!user) return null

  if (user.provider !== 'github') return null
  if (!user.githubUsername || user.githubUsername.toLowerCase() !== ADMIN_GITHUB_USERNAME) return null

  return user
}
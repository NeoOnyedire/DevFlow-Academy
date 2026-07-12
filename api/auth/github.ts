// api/auth/github.ts
//
// Serverless endpoint that completes the GitHub OAuth "Authorization Code"
// flow. The browser never sees the client secret — only this function
// does, via the GITHUB_CLIENT_SECRET environment variable (set in Vercel
// project settings for prod/preview, and in .env.local for local dev —
// never committed to the repo).
//
// Flow:
//   1. Browser redirects the user to GitHub's authorize page (client-side,
//      using the public client ID — see src/lib/githubOAuth.ts).
//   2. GitHub redirects back to /auth/github/callback?code=...&state=...
//   3. The callback page POSTs { code } here.
//   4. This function exchanges the code for a short-lived GitHub access
//      token, fetches the user's public profile (+ primary email if the
//      profile email is private), and returns just enough profile data
//      for the frontend to create a session.
//
// IMPORTANT: the GitHub access token itself is never sent back to the
// browser or persisted anywhere — it's used once, server-side, to fetch
// the profile, then discarded. If a future feature needs authenticated
// GitHub API calls on the user's behalf, that token would need to be
// stored server-side (e.g. in a real database), which this project
// currently doesn't have.

import type { VercelRequest, VercelResponse } from '@vercel/node'

interface GitHubTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  email: string | null
  html_url: string
}

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { code } = (req.body || {}) as { code?: string }
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing authorization code' })
    return
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'GitHub OAuth is not configured on the server.' })
    return
  }

  try {
    // ---- Step 1: exchange the code for an access token ----
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    const tokenData = (await tokenResponse.json()) as GitHubTokenResponse
    if (!tokenData.access_token) {
      res.status(401).json({
        error: 'GITHUB_AUTH_FAILED',
        message: tokenData.error_description || 'GitHub rejected that authorization code.',
      })
      return
    }

    const accessToken = tokenData.access_token

    // ---- Step 2: fetch the user's public profile ----
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    })

    if (!userResponse.ok) {
      res.status(502).json({ error: 'Could not load GitHub profile.' })
      return
    }

    const githubUser = (await userResponse.json()) as GitHubUser

    // ---- Step 3: fall back to the emails endpoint if the profile email is private ----
    let email = githubUser.email
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (emailResponse.ok) {
        const emails = (await emailResponse.json()) as GitHubEmail[]
        email = emails.find(e => e.primary && e.verified)?.email
          ?? emails.find(e => e.verified)?.email
          ?? null
      }
    }

    // Only the minimum needed to create a session goes back to the client.
    res.status(200).json({
      user: {
        githubId: githubUser.id,
        username: githubUser.login,
        name: githubUser.name || githubUser.login,
        email: email || `${githubUser.login}@users.noreply.github.com`,
        avatarUrl: githubUser.avatar_url,
        profileUrl: githubUser.html_url,
      },
    })
  } catch {
    res.status(502).json({ error: 'Failed to reach GitHub. Please try again.' })
  }
}

/**
 * ============================================================================
 * githubOAuth.ts
 * ============================================================================
 *
 * Small client-side helpers for the GitHub OAuth "Authorization Code" flow.
 *
 * No secrets live here — the client ID is public by design (it identifies
 * the OAuth App, not a credential). The client secret only ever lives on
 * the server, inside api/auth/github.ts, as a Vercel/local environment
 * variable that is never shipped to the browser.
 *
 * Flow:
 *   1. buildGitHubAuthorizeUrl() — called when the user clicks
 *      "Continue with GitHub". Redirects the browser to GitHub.
 *   2. GitHub redirects back to /auth/github/callback?code=...&state=...
 *   3. consumeGitHubOAuthState() — called on that callback page to verify
 *      the redirect wasn't forged (CSRF protection) before trusting `code`.
 * ============================================================================
 */

const STATE_STORAGE_KEY = 'devflow_github_oauth_state'

/** Where GitHub should redirect back to after the user approves access. */
export function getGitHubRedirectUri(): string {
  return `${window.location.origin}/auth/github/callback`
}

/**
 * Builds the GitHub "authorize" URL and stores a random CSRF state value
 * in sessionStorage so the callback page can verify the redirect wasn't
 * forged. Returns null if no client ID is configured (lets the UI hide
 * the GitHub button gracefully instead of sending users to a broken flow).
 */
export function buildGitHubAuthorizeUrl(): string | null {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined
  if (!clientId) return null

  const state = crypto.randomUUID()
  sessionStorage.setItem(STATE_STORAGE_KEY, state)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGitHubRedirectUri(),
    scope: 'read:user user:email',
    state,
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

/**
 * Verifies the `state` query param GitHub sent back matches what we
 * stored before redirecting. Single-use — clears itself either way so a
 * captured URL can't be replayed.
 */
export function consumeGitHubOAuthState(returnedState: string | null): boolean {
  const expected = sessionStorage.getItem(STATE_STORAGE_KEY)
  sessionStorage.removeItem(STATE_STORAGE_KEY)
  return !!expected && !!returnedState && expected === returnedState
}

/** Whether a GitHub client ID has been configured for this environment. */
export function isGitHubOAuthConfigured(): boolean {
  return !!(import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined)
}

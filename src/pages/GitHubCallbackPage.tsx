/**
 * GitHubCallbackPage.tsx  —  /auth/github/callback
 *
 * GitHub redirects here after the user approves (or denies) access.
 * This page has no real UI beyond a short status message — it verifies
 * the CSRF state, hands the `code` off to AuthContext.loginWithGitHub,
 * and then bounces to the dashboard (or back home on failure).
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { consumeGitHubOAuthState } from '../lib/githubOAuth'

export default function GitHubCallbackPage() {
  const navigate = useNavigate()
  const { loginWithGitHub } = useAuth()
  const [error, setError] = useState('')
  const hasRun = useRef(false) // guards against React StrictMode double-invoke in dev

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const githubError = params.get('error')

      if (githubError) {
        setError('You cancelled GitHub sign-in, or access was denied.')
        setTimeout(() => navigate('/', { replace: true }), 2500)
        return
      }

      if (!code || !consumeGitHubOAuthState(state)) {
        setError('That sign-in link looks invalid or expired. Please try again.')
        setTimeout(() => navigate('/', { replace: true }), 2500)
        return
      }

      const result = await loginWithGitHub(code)
      if (!result.ok) {
        setError(result.message)
        setTimeout(() => navigate('/', { replace: true }), 3000)
        return
      }

      navigate('/dashboard', { replace: true })
    }

    run()
  }, [navigate, loginWithGitHub])

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <div className="text-center">
        <GitBranch className="w-8 h-8 text-[#F7B731] mx-auto mb-4 animate-pulse" />
        {error ? (
          <>
            <div className="flex items-center justify-center gap-2 text-[#FF4D6D] mb-2">
              <AlertTriangle className="w-4 h-4" />
              <p className="font-display font-semibold">Sign-in didn't go through</p>
            </div>
            <p className="text-white/60 text-sm max-w-sm mx-auto">{error}</p>
            <p className="text-white/30 text-xs mt-3">Redirecting you back…</p>
          </>
        ) : (
          <p className="text-white/70 font-display font-medium">Connecting your GitHub account…</p>
        )}
      </div>
    </div>
  )
}

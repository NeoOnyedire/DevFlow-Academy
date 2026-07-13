/**
 * VerifyEmailPage.tsx  —  /verify-email
 *
 * Landing page for the link emailed on registration (and by the
 * "Resend email" button). Reads ?token= from the URL, calls
 * AuthContext.verifyEmail, then bounces to the dashboard.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, BadgeCheck, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()
  const [error, setError] = useState('')
  const [isDone, setIsDone] = useState(false)
  const hasRun = useRef(false) // guards against React StrictMode double-invoke in dev

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const run = async () => {
      const token = new URLSearchParams(window.location.search).get('token')
      if (!token) {
        setError('This verification link is missing its token.')
        setTimeout(() => navigate('/', { replace: true }), 2500)
        return
      }

      const result = await verifyEmail(token)
      if (!result.ok) {
        setError(result.message)
        setTimeout(() => navigate('/', { replace: true }), 3000)
        return
      }

      setIsDone(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    }

    run()
  }, [navigate, verifyEmail])

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <div className="text-center">
        <GitBranch className="w-8 h-8 text-[#F7B731] mx-auto mb-4 animate-pulse" />
        {error ? (
          <>
            <div className="flex items-center justify-center gap-2 text-[#FF4D6D] mb-2">
              <AlertTriangle className="w-4 h-4" />
              <p className="font-display font-semibold">Verification didn't go through</p>
            </div>
            <p className="text-white/60 text-sm max-w-sm mx-auto">{error}</p>
            <p className="text-white/30 text-xs mt-3">Redirecting you back…</p>
          </>
        ) : isDone ? (
          <>
            <div className="flex items-center justify-center gap-2 text-[#3CCF4A] mb-2">
              <BadgeCheck className="w-5 h-5" />
              <p className="font-display font-semibold">Email verified!</p>
            </div>
            <p className="text-white/60 text-sm">Taking you to your dashboard…</p>
          </>
        ) : (
          <p className="text-white/70 font-display font-medium">Verifying your email…</p>
        )}
      </div>
    </div>
  )
}

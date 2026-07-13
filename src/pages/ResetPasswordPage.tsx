/**
 * ResetPasswordPage.tsx  —  /reset-password
 *
 * Landing page for the link emailed by request-password-reset.ts.
 * Reads ?token= from the URL, lets the person choose a new password,
 * and submits it via AuthContext.resetPassword — which also signs
 * them in immediately on success.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  const token = new URLSearchParams(window.location.search).get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const result = await resetPassword(token, password)
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setIsDone(true)
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
  }

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <GitBranch className="w-5 h-5 text-[#F7B731]" />
          <span className="font-display text-lg font-semibold text-white">DevFlow Academy</span>
        </div>

        <div className="bg-[#4A2F2F] card-radius card-shadow p-6 md:p-8">
          {!token ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-[#FF4D6D] mb-2">
                <AlertTriangle className="w-4 h-4" />
                <p className="font-display font-semibold">Invalid reset link</p>
              </div>
              <p className="text-white/60 text-sm">
                This link is missing its token. Please request a new password reset from the login screen.
              </p>
            </div>
          ) : isDone ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#3CCF4A]/20 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-[#3CCF4A]" />
              </div>
              <p className="font-display font-bold text-white text-xl mb-1">Password updated</p>
              <p className="text-white/60 text-sm">Taking you to your dashboard…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-[#F7B731]" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-white text-xl">Choose a new password</h1>
                  <p className="text-white/50 text-sm">This link works once and expires in an hour.</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[#FF4D6D]/20 text-[#FF4D6D] text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-accent text-[10px] uppercase tracking-[0.14em] text-white/50 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10
                        focus:border-[#F7B731]/50 focus:outline-none transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-accent text-[10px] uppercase tracking-[0.14em] text-white/50 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10
                      focus:border-[#F7B731]/50 focus:outline-none transition-colors disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-rose-punch text-white font-display font-semibold py-3.5 rounded-xl
                    hover:bg-[#ff3d5d] disabled:opacity-50 transition-all duration-200"
                >
                  {isSubmitting ? '...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

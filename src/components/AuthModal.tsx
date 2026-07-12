/**
 * ============================================================================
 * AuthModal.tsx
 * ============================================================================
 *
 * Authentication modal component — handles both Login and Register flows.
 * Switches between modes dynamically. Validates inputs client-side.
 * Shows friendly error messages. Auto-focuses first input on open.
 *
 * Now also offers "Continue with GitHub" above the form — redirects to
 * GitHub's OAuth authorize page, which eventually lands the user back on
 * /auth/github/callback, fully signed in, with no password ever created.
 * The GitHub button only renders if VITE_GITHUB_CLIENT_ID is configured,
 * so this degrades gracefully to email/password-only if it isn't set up.
 *
 * Props: none — reads from AuthContext
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, LogIn, UserPlus, Eye, EyeOff, Github } from 'lucide-react'
import { buildGitHubAuthorizeUrl, isGitHubOAuthConfigured } from '../lib/githubOAuth'

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register, openAuthModal } = useAuth()

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const githubEnabled = isGitHubOAuthConfigured()

  // Auto-focus the first input when modal opens
  const firstInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (isAuthModalOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
      // Reset form state on open
      setError('')
      setIsSubmitting(false)
    }
  }, [isAuthModalOpen, authModalMode])

  // Close modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal()
    }
    if (isAuthModalOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isAuthModalOpen, closeAuthModal])

  /** Kick off the GitHub OAuth redirect. */
  const handleGitHubLogin = () => {
    const url = buildGitHubAuthorizeUrl()
    if (!url) {
      setError('GitHub sign-in is not configured yet.')
      return
    }
    window.location.href = url
  }

  /** Handle form submission — validates inputs and calls auth functions */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (authModalMode === 'register' && !name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)

    if (authModalMode === 'login') {
      const success = login(email, password)
      if (success) {
        closeAuthModal()
        setEmail('')
        setPassword('')
      } else {
        setError('Invalid email or password. Try registering first!')
      }
    } else {
      const success = register(name, email, password)
      if (success) {
        closeAuthModal()
        setName('')
        setEmail('')
        setPassword('')
      } else {
        setError('An account with this email already exists')
      }
    }

    setIsSubmitting(false)
  }

  // Don't render if modal is closed
  if (!isAuthModalOpen) return null

  const isLogin = authModalMode === 'login'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAuthModal}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md bg-[#4A2F2F] card-radius card-shadow p-6 md:p-8 animate-[fadeIn_0.2s_ease-out]">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
            {isLogin ? <LogIn className="w-5 h-5 text-[#F7B731]" /> : <UserPlus className="w-5 h-5 text-[#F7B731]" />}
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-xl">
              {isLogin ? 'Welcome Back' : 'Join DevFlow Academy'}
            </h3>
            <p className="text-white/50 text-sm">
              {isLogin ? 'Login to access your lessons' : 'Create a free account to start learning'}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FF4D6D]/20 text-[#FF4D6D] text-sm font-medium">
            {error}
          </div>
        )}

        {/* GitHub OAuth — the recommended path, shown first */}
        {githubEnabled && (
          <>
            <button
              type="button"
              onClick={handleGitHubLogin}
              className="w-full flex items-center justify-center gap-2.5 bg-[#24292F] hover:bg-[#1b1f24]
                text-white font-display font-semibold py-3.5 rounded-xl transition-colors mb-2"
            >
              <Github className="w-4 h-4" />
              Continue with GitHub
            </button>
            <p className="text-white/35 text-xs text-center mb-5">
              Fastest option — no password to create or remember.
            </p>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-white/30 text-xs font-accent uppercase tracking-wider">or use email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field — only for registration */}
          {!isLogin && (
            <div>
              <label className="block font-accent text-[10px] uppercase tracking-[0.14em] text-white/50 mb-1.5">
                Full Name
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10
                  focus:border-[#F7B731]/50 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block font-accent text-[10px] uppercase tracking-[0.14em] text-white/50 mb-1.5">
              Email Address
            </label>
            <input
              ref={isLogin ? firstInputRef : undefined}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10
                focus:border-[#F7B731]/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Password field with show/hide toggle */}
          <div>
            <label className="block font-accent text-[10px] uppercase tracking-[0.14em] text-white/50 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10
                  focus:border-[#F7B731]/50 focus:outline-none transition-colors"
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-punch text-white font-display font-semibold py-3.5 rounded-xl
              hover:bg-[#ff3d5d] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? '...' : isLogin ? 'Log In' : 'Create Free Account'}
          </button>
        </form>

        {/* Toggle between login/register */}
        <p className="text-center text-white/50 text-sm mt-5">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              openAuthModal(isLogin ? 'register' : 'login')
              setError('')
            }}
            className="text-[#F7B731] hover:underline font-medium"
          >
            {isLogin ? 'Join Free' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  )
}

/**
 * EmailVerificationBanner.tsx
 *
 * Shown across the app (via PageWrapper) for logged-in users whose
 * email isn't verified yet. Doesn't block anything — just a nudge, with
 * a one-click resend. Dismissal is session-only (plain component state,
 * not persisted) so it reappears on the next visit as a gentle reminder
 * rather than being gone forever after one click.
 */
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, X } from 'lucide-react'

export default function EmailVerificationBanner() {
  const { isLoggedIn, user, resendVerificationEmail } = useAuth()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')

  if (!isLoggedIn || !user || user.emailVerified || isDismissed) return null

  const handleResend = async () => {
    setIsSending(true)
    setMessage('')
    const result = await resendVerificationEmail()
    setIsSending(false)
    setMessage(result.message)
  }

  return (
    <div className="bg-[#F7B731]/15 border-b border-[#F7B731]/30 px-4 md:px-[6vw] py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2 text-white/80 text-xs md:text-sm">
          <Mail className="w-4 h-4 text-[#F7B731] flex-shrink-0" />
          <span>
            {message || `Please verify your email (${user.email}) to keep your account secure.`}
          </span>
        </div>
        <button
          onClick={handleResend}
          disabled={isSending}
          className="font-accent text-[10px] uppercase tracking-[0.12em] text-[#F7B731] hover:text-[#f0ad28]
            disabled:opacity-50 transition-colors"
        >
          {isSending ? 'Sending…' : 'Resend email'}
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-auto text-white/40 hover:text-white/70 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

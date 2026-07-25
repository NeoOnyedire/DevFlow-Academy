/**
 * ============================================================================
 * ReviewModal.tsx
 * ============================================================================
 *
 * Review modal — users must leave a review before they can "complete" the
 * course. Requires Gitter AI to be activated (a BYOK key set — see
 * lib/gitterKeys.ts), and runs the review through /api/moderate-review
 * using that same key before the real submission to /api/reviews goes
 * through. The AI's short reply is shown directly to the reviewer,
 * whether approving or asking them to revise.
 * ============================================================================
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { X, Star, Send, Sparkles } from 'lucide-react'
import { getGitterCredentials } from '../lib/gitterKeys'

export default function ReviewModal() {
  const { isReviewModalOpen, closeReviewModal, submitReview } = useApp()

  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModerating, setIsModerating] = useState(false)

  const credentials = getGitterCredentials()

  const handleSubmit = async () => {
    setError('')
    setInfoMessage('')

    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters')
      return
    }
    if (!credentials) {
      setError('Activate Gitter AI with a free API key first — see the Gitter chat in the bottom-right corner.')
      return
    }

    setIsSubmitting(true)
    setIsModerating(true)

    try {
      const modResponse = await fetch('/api/moderate-review', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          apiKey: credentials.apiKey,
          provider: credentials.provider,
        }),
      })
      const modData = await modResponse.json()
      setIsModerating(false)

      if (!modResponse.ok) {
        setError(modData.message || modData.error || 'Could not check your review right now. Please try again.')
        setIsSubmitting(false)
        return
      }

      if (!modData.valid) {
        setError(modData.reply || "That review didn't look like genuine course feedback — please revise and try again.")
        setIsSubmitting(false)
        return
      }

      // Approved — show the AI's reply briefly, then submit for real.
      setInfoMessage(modData.reply || 'Thanks for your feedback!')
      setTimeout(async () => {
        const result = await submitReview(rating, comment)
        if (!result.ok) {
          setIsSubmitting(false)
          setInfoMessage('')
          setError(result.message)
          return
        }
        setRating(0)
        setComment('')
        // submitReview closes the modal itself on success.
      }, 1400)
    } catch {
      setIsModerating(false)
      setIsSubmitting(false)
      setError('Could not reach the AI check right now. Please try again.')
    }
  }

  if (!isReviewModalOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeReviewModal} />

      <div className="relative w-full max-w-lg bg-[#4A2F2F] card-radius card-shadow p-6 md:p-8">
        <button
          onClick={closeReviewModal}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#F7B731]/20 flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 text-[#F7B731]" />
          </div>
          <h3 className="font-display font-bold text-white text-2xl mb-1">
            Almost There!
          </h3>
          <p className="text-white/60 text-sm">
            Leave a quick, public review to complete your course and earn your certificate — it'll show up for
            every future learner on the homepage.
          </p>
        </div>

        {!credentials && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#F7B731]/15 border border-[#F7B731]/30 px-4 py-3">
            <Sparkles className="w-4 h-4 text-[#F7B731] flex-shrink-0 mt-0.5" />
            <p className="text-white/80 text-sm">
              Reviews are checked by Gitter AI before publishing, using your own free API key. Open the Gitter
              chat in the bottom-right corner and add one, then come back here.
            </p>
          </div>
        )}

        {credentials && (
          <p className="text-white/40 text-xs text-center mb-4">
            Your review will be quickly checked by Gitter AI ({credentials.provider}) before publishing.
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FF4D6D]/20 text-[#FF4D6D] text-sm font-medium text-center">
            {error}
          </div>
        )}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#3CCF4A]/20 text-[#3CCF4A] text-sm font-medium text-center">
            {infoMessage}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-[#F7B731] fill-[#F7B731]'
                    : 'text-white/20'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block font-accent text-[10px] uppercase tracking-[0.14em] text-white/50 mb-2">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What did you learn? How was the experience? Help future learners know what to expect..."
            rows={4}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10
              focus:border-[#F7B731]/50 focus:outline-none transition-colors resize-none text-sm disabled:opacity-60"
          />
          <p className="text-white/30 text-xs mt-1 text-right">{comment.length} chars</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !credentials}
          className="w-full bg-rose-punch text-white font-display font-semibold py-3.5 rounded-xl
            hover:bg-[#ff3d5d] disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isModerating ? 'Checking with Gitter AI…' : isSubmitting ? 'Submitting…' : 'Submit Review & Complete Course'}
        </button>
      </div>
    </div>
  )
}
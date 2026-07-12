/**
 * ============================================================================
 * ReviewModal.tsx
 * ============================================================================
 *
 * Review modal — users must leave a review before they can "complete" the
 * course. This collects a star rating (1-5) and a written comment.
 *
 * Submitting now posts to the shared /api/reviews backend (see
 * AppContext.submitReview), so the review is genuinely visible to every
 * visitor in ReviewsSection — not just the browser that wrote it.
 *
 * Props: none — reads from AppContext
 * ============================================================================
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { X, Star, Send } from 'lucide-react'

export default function ReviewModal() {
  const { isReviewModalOpen, closeReviewModal, submitReview } = useApp()

  // Local form state
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /** Submit handler — validates client-side, then posts to the shared backend */
  const handleSubmit = async () => {
    setError('')

    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters')
      return
    }

    setIsSubmitting(true)
    const result = await submitReview(rating, comment)
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    // Reset form after successful submission
    setRating(0)
    setComment('')
  }

  // Don't render if modal is closed
  if (!isReviewModalOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeReviewModal}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-[#4A2F2F] card-radius card-shadow p-6 md:p-8">
        {/* Close button */}
        <button
          onClick={closeReviewModal}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
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

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FF4D6D]/20 text-[#FF4D6D] text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Star rating */}
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

        {/* Comment textarea */}
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

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-rose-punch text-white font-display font-semibold py-3.5 rounded-xl
            hover:bg-[#ff3d5d] disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Submitting…' : 'Submit Review & Complete Course'}
        </button>
      </div>
    </div>
  )
}

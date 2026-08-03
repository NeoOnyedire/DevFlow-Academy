/**
 * ============================================================================
 * ReviewCard.tsx
 * ============================================================================
 *
 * Single review card — star rating, comment, and author. Extracted out of
 * ReviewsSection so it can be shared between the landing-page preview
 * (3 most recent reviews, see ReviewsSection.tsx) and the full list on
 * /reviews (see pages/ReviewsPage.tsx) without the two ever drifting out
 * of sync visually.
 * ============================================================================
 */
import { Star } from 'lucide-react'
import type { PublicReview } from '../context/AppContext'

interface Props {
  review: PublicReview
  className?: string
}

export default function ReviewCard({ review, className = '' }: Props) {
  return (
    <div className={`bg-[#4A2F2F] card-radius p-5 card-outline flex flex-col ${className}`}>
      {/* Stars */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= review.rating ? 'text-[#F7B731] fill-[#F7B731]' : 'text-white/20'}`}
          />
        ))}
      </div>

      {/* Decorative opening mark + comment as plain text */}
      <div className="flex-1 mb-4">
        <span className="block font-display text-4xl leading-none text-[#F7B731]/40 mb-1 select-none" aria-hidden="true">
          "
        </span>
        <p className="text-white/80 text-sm leading-relaxed">
          {review.comment}
        </p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <div className="w-8 h-8 rounded-full bg-[#F7B731]/30 flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-[#F7B731] text-xs">
            {review.userName.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <p className="text-white text-sm font-medium">{review.userName}</p>
          <p className="text-white/40 text-xs">
            {new Date(review.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}

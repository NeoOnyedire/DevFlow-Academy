/**
 * ============================================================================
 * ReviewsSection.tsx
 * ============================================================================
 *
 * Displays user reviews in a horizontal scrolling card layout.
 *
 * Reviews come from AppContext.reviews, fetched from the shared
 * /api/reviews backend — every visitor sees the same list.
 * ============================================================================
 */

import { useApp } from '../context/AppContext'
import { Star, MessageCircle } from 'lucide-react'

export default function ReviewsSection() {
  const { reviews, isLoadingReviews, reviewsError } = useApp()

  return (
    <section className="bg-espresso py-16 md:py-20 px-[6vw]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-[#F7B731]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white text-2xl md:text-3xl">What Learners Say</h3>
          <p className="text-white/50 text-sm font-accent uppercase tracking-wider">
            {isLoadingReviews ? 'Loading reviews…' : `${reviews.length} reviews`}
          </p>
        </div>
      </div>

      {reviewsError && (
        <p className="text-white/40 text-sm mb-6">
          Couldn't load the latest reviews right now — showing what we have.
        </p>
      )}

      {!isLoadingReviews && reviews.length === 0 && (
        <p className="text-white/40 text-sm">
          No reviews yet — be the first to complete the course and leave one!
        </p>
      )}

      {/* Cards */}
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
        scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {reviews.map((review, i) => (
          <div
            key={`${review.userName}-${review.date}-${i}`}
            className="min-w-[280px] md:min-w-0 bg-[#4A2F2F] card-radius p-5 card-outline snap-start flex flex-col"
          >
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
        ))}
      </div>
    </section>
  )
}
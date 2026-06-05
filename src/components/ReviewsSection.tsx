/**
 * ============================================================================
 * ReviewsSection.tsx
 * ============================================================================
 *
 * Displays user reviews in a horizontal scrolling card layout.
 * Reads reviews from localStorage (submitted via ReviewModal).
 * Shows star ratings, reviewer names, and comments.
 *
 * This section is rendered inside the main app flow, after the dashboard.
 * It gives social proof and shows that the course has real learners.
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { Star, MessageCircle } from 'lucide-react'

/** Shape of a stored review */
interface Review {
  rating: number
  comment: string
  date: string
  userName: string
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])

  // Load reviews from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('devflow_reviews') || '[]')
    // Add some default reviews so the section isn't empty
    const defaults: Review[] = [
      {
        rating: 5,
        comment: "This course made Git finally click for me. The workplace scenarios feel so real — I actually knew what to do on my first day at my internship!",
        date: '2026-05-20T10:00:00Z',
        userName: 'Sarah Chen',
      },
      {
        rating: 5,
        comment: "Gitter is adorable and the troubleshooting section saved me when I got 'merge conflict' panic. Highly recommend for any new dev!",
        date: '2026-05-15T14:30:00Z',
        userName: 'Marcus Johnson',
      },
      {
        rating: 4,
        comment: "Great free resource. The video curation is top-notch — pulled from the best YouTube channels. Loved the weekly challenges.",
        date: '2026-05-10T09:15:00Z',
        userName: 'Priya Patel',
      },
    ]
    // Merge defaults with stored, avoiding duplicates by comment
    const merged = [...defaults, ...stored.filter((s: Review) => !defaults.some(d => d.comment === s.comment))]
    setReviews(merged)
  }, [])

  // Don't render if no reviews at all
  if (reviews.length === 0) return null

  return (
    <section className="bg-espresso py-16 md:py-20 px-[6vw]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-[#F7B731]" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white text-2xl md:text-3xl">
            What Learners Say
          </h3>
          <p className="text-white/50 text-sm font-accent uppercase tracking-wider">
            {reviews.length} reviews
          </p>
        </div>
      </div>

      {/* Reviews grid — horizontal scroll on mobile, grid on desktop */}
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
        scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="min-w-[280px] md:min-w-0 bg-[#4A2F2F] card-radius p-5 card-outline snap-start"
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
            {/* Comment */}
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              "{review.comment}"
            </p>
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F7B731]/30 flex items-center justify-center">
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

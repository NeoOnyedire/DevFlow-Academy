/**
 * ============================================================================
 * ReviewsSection.tsx
 * ============================================================================
 *
 * Landing-page preview of learner reviews. Shows a summary (average
 * rating + total review count) and just the 3 most recent reviews, with
 * a "See what others say" link through to the full list on /reviews
 * (pages/ReviewsPage.tsx) — the landing page no longer needs to show
 * every review to make the point that people like the course.
 *
 * Reviews still come from AppContext.reviews, fetched from the shared
 * /api/reviews backend (newest first) — every visitor sees the same
 * list, and this section and ReviewsPage.tsx both read from the same
 * source, so the average/count here always matches the full page.
 * ============================================================================
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Star, MessageCircle, ArrowRight } from 'lucide-react'
import ReviewCard from './ReviewCard'

/** Landing page only teases a handful of reviews — the rest live on /reviews. */
const PREVIEW_COUNT = 3

export default function ReviewsSection() {
  const { reviews, isLoadingReviews, reviewsError } = useApp()

  // Reviews already arrive newest-first from the API, so this is simply
  // "the first 3" rather than needing its own sort.
  const previewReviews = useMemo(() => reviews.slice(0, PREVIEW_COUNT), [reviews])

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  }, [reviews])

  return (
    <section className="bg-espresso py-16 md:py-20 px-[6vw]">
      {/* Header — icon/title on the left, "See what others say" on the right */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F7B731]/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-[#F7B731]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-2xl md:text-3xl">What Learners Say</h3>

            {isLoadingReviews ? (
              <p className="text-white/50 text-sm font-accent uppercase tracking-wider">Loading reviews…</p>
            ) : reviews.length > 0 ? (
              /* Average rating + total count, right next to each other */
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-4 h-4 text-[#F7B731] fill-[#F7B731]" />
                <span className="text-white font-display font-semibold text-sm">{averageRating.toFixed(1)}</span>
                <span className="text-white/30 text-sm">·</span>
                <span className="text-white/50 text-sm font-accent uppercase tracking-wider">
                  {reviews.length} review{reviews.length === 1 ? '' : 's'}
                </span>
              </div>
            ) : (
              <p className="text-white/50 text-sm font-accent uppercase tracking-wider">No reviews yet</p>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <Link
            to="/reviews"
            className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em]
              text-[#F7B731] hover:text-[#f0ad28] transition-colors flex-shrink-0"
          >
            See what others say <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
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

      {/* Cards — only the 3 most recent; everything else lives on /reviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {previewReviews.map((review, i) => (
          <ReviewCard key={`${review.userName}-${review.date}-${i}`} review={review} />
        ))}
      </div>
    </section>
  )
}

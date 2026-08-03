/**
 * ReviewsPage.tsx  —  /reviews
 *
 * The full list of learner reviews — every review from the shared
 * /api/reviews backend, not just the 3-review preview shown on the
 * landing page (see components/ReviewsSection.tsx). Shows the same
 * average-rating + total-count summary at the top for consistency, and
 * reuses ReviewCard so individual cards never visually drift from the
 * landing-page preview.
 */
import { useEffect, useMemo } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import ReviewCard from '../components/ReviewCard'
import { useApp } from '../context/AppContext'
import { MessageCircle, Star } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function ReviewsPage() {
  const { reviews, isLoadingReviews, reviewsError } = useApp()

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  }, [reviews])

  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 md:py-24 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-[#F7B731]" />
          <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">Reviews</span>
        </div>

        <h1 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-4"
          style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          What Learners Say
        </h1>

        {/* Summary — average rating + total count, same numbers shown on the landing page */}
        {isLoadingReviews ? (
          <p className="text-white/50 text-sm mb-12">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <div className="flex items-center gap-2 mb-12">
            <Star className="w-5 h-5 text-[#F7B731] fill-[#F7B731]" />
            <span className="font-display font-bold text-white text-xl">{averageRating.toFixed(1)}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/60 text-sm font-accent uppercase tracking-wider">
              {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </span>
          </div>
        ) : (
          <p className="text-white/50 text-sm mb-12">No reviews yet.</p>
        )}

        {reviewsError && (
          <p className="text-white/40 text-sm mb-8">
            Couldn't load the latest reviews right now — showing what we have.
          </p>
        )}

        {!isLoadingReviews && reviews.length === 0 && (
          <p className="text-white/40 text-sm">
            No reviews yet — be the first to complete the course and leave one!
          </p>
        )}

        {/* Every review, not just the landing-page preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <ReviewCard key={`${review.userName}-${review.date}-${i}`} review={review} />
          ))}
        </div>
      </section>
    </PageWrapper>
  )
}

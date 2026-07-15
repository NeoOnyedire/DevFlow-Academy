/**
 * NotFoundPage.tsx  —  catch-all route (*)
 *
 * Previously, unknown routes silently rendered LandingPage — confusing
 * for a bookmarked or shared bad link, since the URL bar says one thing
 * and the page says another. This is a real 404 with normal nav intact.
 */
import { Link } from 'react-router-dom'
import { GitBranch, Compass } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'

export default function NotFoundPage() {
  return (
    <PageWrapper bg="bg-espresso">
      <section className="min-h-[70vh] flex items-center justify-center px-6 py-24 text-center">
        <div>
          <GitBranch className="w-10 h-10 text-[#F7B731] mx-auto mb-6" />
          <p className="font-display text-7xl md:text-9xl font-bold text-white mb-4 leading-none">404</p>
          <h1 className="font-display font-bold text-white text-2xl mb-3">Branch not found</h1>
          <p className="text-white/60 text-sm max-w-sm mx-auto mb-8">
            Whatever you were looking for doesn't live at this URL — it might've been renamed, moved, or never
            existed in the first place.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-rose-punch text-white font-display font-semibold px-6 py-3
              card-radius card-shadow hover:scale-105 transition-all duration-300"
          >
            <Compass className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </section>
    </PageWrapper>
  )
}

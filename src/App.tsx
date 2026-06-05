/**
 * ============================================================================
 * App.tsx
 * ============================================================================
 *
 * Root component for DevFlow Academy. Orchestrates all sections,
 * context providers, modals, and global scroll behavior.
 *
 * Architecture:
 * - AuthProvider: manages login/register state
 * - AppProvider: manages curriculum, reviews, progress
 * - Pinned sections (1-5): full-viewport with GSAP ScrollTrigger
 * - Flowing sections (6-8): normal scroll with reveal animations
 * - Global snap: ensures users land on section centers, not mid-animation
 * - Floating modals: AuthModal, CurriculumPanel, ReviewModal (portal-like)
 *
 * Section order:
 * 1. Hero (pinned)
 * 2. Learn Grid (pinned)
 * 3. Troubleshoot (pinned)
 * 4. Commit Scenes (pinned)
 * 5. Before/After (pinned)
 * 6. Dashboard (flowing)
 * 7. Reviews (flowing)
 * 8. Challenge (flowing)
 * 9. Footer (flowing)
 * ============================================================================
 */

import { useEffect, useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Context providers
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'

// Components
import Navigation from './components/Navigation'
import AuthModal from './components/AuthModal'
import CurriculumPanel from './components/CurriculumPanel'
import ReviewModal from './components/ReviewModal'
import ReviewsSection from './components/ReviewsSection'

// Sections
import HeroSection from './sections/HeroSection'
import LearnGridSection from './sections/LearnGridSection'
import TroubleshootSection from './sections/TroubleshootSection'
import CommitScenesSection from './sections/CommitScenesSection'
import BeforeAfterSection from './sections/BeforeAfterSection'
import DashboardSection from './sections/DashboardSection'
import ChallengeSection from './sections/ChallengeSection'
import FooterSection from './sections/FooterSection'

gsap.registerPlugin(ScrollTrigger)

/** Inner app component — all hooks run inside providers */
function AppInner() {
  const mainRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  /**
   * Global scroll snap configuration.
   * Creates a ScrollTrigger snap that only activates inside pinned sections.
   * Users land on the "settle" center of each pinned section, never mid-animation.
   * Flowing sections allow free scroll.
   */
  useEffect(() => {
    // Delay to ensure all section ScrollTriggers are registered
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start)

      const maxScroll = ScrollTrigger.maxScroll(window)
      if (!maxScroll || pinned.length === 0) return

      // Build ranges for each pinned section (normalized 0-1)
      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }))

      // Create the global snap ScrollTrigger
      const globalSnap = ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            // Only snap if inside a pinned range (with 2% buffer)
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            )
            if (!inPinned) return value // flowing section: free scroll

            // Find the nearest pinned section center
            const target = pinnedRanges.reduce((closest, r) =>
              Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            )
            return target
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        }
      })

      return () => {
        globalSnap.kill()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  /**
   * Navigation show/hide based on scroll position.
   * Nav appears after scrolling past the hero section (~100vh).
   */
  useLayoutEffect(() => {
    const showNav = () => {
      if (navRef.current) {
        gsap.to(navRef.current, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
      }
    }
    const hideNav = () => {
      if (navRef.current) {
        gsap.to(navRef.current, { y: -100, opacity: 0, duration: 0.3, ease: 'power2.out' })
      }
    }

    ScrollTrigger.create({
      trigger: mainRef.current,
      start: 'top -100vh',
      onEnter: showNav,
      onLeaveBack: hideNav,
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  return (
    <>
      {/* Film grain texture overlay — subtle, static, pointer-events none */}
      <div className="grain-overlay" />

      {/* Fixed navigation — hidden initially, shown after scrolling */}
      <div ref={navRef} className="fixed top-0 left-0 w-full z-[100] opacity-0 -translate-y-full">
        <Navigation />
      </div>

      {/* Floating modals — rendered at root level for portal-like behavior */}
      <AuthModal />
      <CurriculumPanel />
      <ReviewModal />

      {/* Main scrollable content */}
      <main ref={mainRef} className="relative">
        {/* Pinned sections — z-index increases so next section overlays previous */}
        <div className="relative z-10">
          <HeroSection className="section-pinned bg-espresso" />
        </div>
        <div className="relative z-20">
          <LearnGridSection className="section-pinned bg-sun-yellow" />
        </div>
        <div className="relative z-30">
          <TroubleshootSection className="section-pinned bg-espresso" />
        </div>
        <div className="relative z-40">
          <CommitScenesSection className="section-pinned bg-sun-yellow" />
        </div>
        <div className="relative z-50">
          <BeforeAfterSection className="section-pinned bg-espresso" />
        </div>

        {/* Flowing sections — normal scroll behavior */}
        <div className="relative z-[60]">
          <DashboardSection className="bg-sun-yellow" />
        </div>
        <div className="relative z-[65]">
          <ReviewsSection />
        </div>
        <div className="relative z-[70]">
          <ChallengeSection className="bg-espresso" />
        </div>
        <div className="relative z-[80]">
          <FooterSection className="bg-sun-yellow" />
        </div>
      </main>
    </>
  )
}

/** Root App — wraps everything in context providers */
export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </AuthProvider>
  )
}

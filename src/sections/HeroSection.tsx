/**
 * ============================================================================
 * HeroSection.tsx
 * ============================================================================
 *
 * The landing hero section — first thing users see.
 * Features the bold "Git yourself Repo-Ready" headline, body copy,
 * CTA buttons, and Gitter the cat mascot illustration.
 *
 * CHANGES from v1:
 * - Removed the speech bubble (user found it redundant)
 * - Added auth-gated CTA — "Start First Lesson" opens curriculum
 *   or auth modal if not logged in
 * - "Browse Curriculum" opens the curriculum panel directly
 * - Fully mobile responsive — stacked layout on small screens
 *
 * Animation:
 * - Auto-play entrance on page load (staggered fade + slide)
 * - Scroll-driven exit (slides elements away as user scrolls down)
 * - onLeaveBack resets all elements to visible when returning to top
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

export default function HeroSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()

  // Refs for GSAP animation targets
  const sectionRef = useRef<HTMLDivElement>(null)
  const h1Line1Ref = useRef<HTMLDivElement>(null)
  const h1Line2Ref = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)

  /** Handle "Start First Lesson" click — requires login */
  const handleStartLesson = () => {
    if (isLoggedIn) {
      openCurriculum()
    } else {
      openAuthModal('register')
    }
  }

  /** Handle "Browse Curriculum" click — always opens panel */
  const handleBrowseCurriculum = () => {
    openCurriculum()
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      // ---- AUTO-PLAY ENTRANCE (page load, ~1.1s total) ----
      // Each element animates in with staggered delays for a
      // cinematic reveal effect. This only runs once on mount.
      const loadTl = gsap.timeline({ delay: 0.2 })

      loadTl
        // Line 1 of headline slides up + fades in
        .fromTo(h1Line1Ref.current,
          { y: 40, rotate: -1, opacity: 0 },
          { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
        // Line 2 follows with slight overlap
        .fromTo(h1Line2Ref.current,
          { y: 40, rotate: -1, opacity: 0 },
          { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.48'
        )
        // Body copy fades up
        .fromTo(bodyRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
          '-=0.3'
        )
        // Primary CTA
        .fromTo(ctaRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
          '-=0.25'
        )
        // Ghost link
        .fromTo(ghostRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
          '-=0.25'
        )
        // Cat mascot slides in from right with bounce
        .fromTo(catRef.current,
          { x: '10vw', scale: 0.96, opacity: 0 },
          { x: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' },
          '-=0.5'
        )

      // ---- SCROLL-DRIVEN EXIT ANIMATION ----
      // Elements are already visible from load animation above.
      // ScrollTrigger handles only the exit phase (70%-100%).
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          // When user scrolls back to top, force-reset visibility
          onLeaveBack: () => {
            gsap.set([h1Line1Ref.current, h1Line2Ref.current, bodyRef.current, ctaRef.current, ghostRef.current, catRef.current], {
              opacity: 1, x: 0, y: 0, scale: 1, rotate: 0
            })
          }
        }
      })

      // Phase 3: EXIT (70% - 100%) — elements slide away
      scrollTl
        .fromTo([h1Line1Ref.current, h1Line2Ref.current],
          { x: 0, opacity: 1 },
          { x: '-55vw', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .fromTo(bodyRef.current,
          { y: 0, opacity: 1 },
          { y: '22vh', opacity: 0, ease: 'power2.in' },
          0.72
        )
        .fromTo([ctaRef.current, ghostRef.current],
          { y: 0, opacity: 1 },
          { y: '22vh', opacity: 0, ease: 'power2.in' },
          0.74
        )
        .fromTo(catRef.current,
          { x: 0, scale: 1, opacity: 1 },
          { x: '35vw', scale: 1.04, opacity: 0, ease: 'power2.in' },
          0.70
        )

    }, section)

    // Cleanup GSAP animations on unmount
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`${className} flex items-center justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      {/* Subtle warm glow behind the cat — adds depth */}
      <div
        className="absolute pointer-events-none hidden md:block"
        style={{
          right: '8vw',
          top: '12vh',
          width: '42vw',
          height: '70vh',
          background: 'radial-gradient(ellipse at center, rgba(247, 183, 49, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* ---- HEADLINE GROUP ---- */}
      <div className="absolute left-[6vw] top-[10vh] w-[88vw] md:w-[70vw]">
        <div ref={h1Line1Ref} className="font-display font-bold text-white heading-responsive tracking-[0.02em]"
          style={{ fontSize: 'clamp(42px, 9vw, 132px)' }}>
          Git yourself
        </div>
        <div ref={h1Line2Ref} className="font-display font-bold text-white heading-responsive tracking-[0.02em]"
          style={{ fontSize: 'clamp(42px, 9vw, 132px)' }}>
          Repo-Ready.
        </div>
      </div>

      {/* ---- BODY COPY ---- */}
      <div ref={bodyRef} className="absolute left-[6vw] top-[38vh] md:top-[52vh] w-[80vw] md:w-[34vw]">
        <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(15px, 1.2vw, 18px)' }}>
          A friendly, practical course in Git & GitHub—built for beginners, taught like you're already on the team.
          All videos are free from the best educators on YouTube.
        </p>
      </div>

      {/* ---- CTA BUTTONS ---- */}
      <div ref={ctaRef} className="absolute left-[6vw] top-[52vh] md:top-[66vh]">
        <button
          onClick={handleStartLesson}
          className="bg-rose-punch text-white font-display font-semibold px-6 md:px-8 py-3 md:py-4 card-radius card-shadow
            hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300"
          style={{ fontSize: 'clamp(15px, 1.4vw, 20px)' }}>
          {isLoggedIn ? 'Start First Lesson' : 'Join Free & Start Learning'}
        </button>
      </div>

      {/* Ghost link — opens curriculum panel */}
      <div ref={ghostRef} className="absolute left-[6vw] top-[64vh] md:top-[76vh]">
        <button
          onClick={handleBrowseCurriculum}
          className="text-white/60 font-accent text-xs uppercase tracking-[0.14em] hover:text-white transition-colors underline underline-offset-4"
        >
          Browse the curriculum
        </button>
      </div>

      {/* ---- GITTER THE CAT MASCOT ---- */}
      {/* Hidden on mobile (too cramped), shown on md+ screens */}
      <div ref={catRef} className="absolute hidden md:block" style={{ right: '6vw', top: '18vh', width: '38vw', maxWidth: '520px' }}>
        <img
          src="/hero_cat.png"
          alt="Gitter the cat mascot"
          className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
        />
      </div>
    </section>
  )
}

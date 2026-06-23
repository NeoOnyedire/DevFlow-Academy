/**
 * ============================================================================
 * HeroSection.tsx
 * ============================================================================
 *
 * The landing hero section — first thing users see.
 * Features the bold "Git yourself Repo-Ready" headline, body copy,
 * CTA buttons, and Gitter the cat mascot illustration.
 *
 * CTA behaviour (intentionally distinct):
 * - Primary "Start First Lesson" / "Join Free & Start Learning":
 *     Opens the curriculum panel at mod-01 (the actual first lesson).
 *     If not logged in, opens the register modal instead.
 * - Secondary "See what's inside":
 *     Smooth-scrolls down to the LearnGrid section so the user can
 *     browse the lesson cards without committing to anything.
 *     Never requires login — it's a pure discovery action.
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
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { ChevronDown } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

interface Props {
  className?: string
}

export default function HeroSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()

  const sectionRef = useRef<HTMLDivElement>(null)
  const h1Line1Ref = useRef<HTMLDivElement>(null)
  const h1Line2Ref = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)

  /**
   * Primary CTA — takes the user straight into lesson 1.
   * Logged-in users open the curriculum panel at the first module.
   * Guests are asked to register first (they'll be auto-redirected after).
   */
  const handleStartLesson = () => {
    if (isLoggedIn) {
      openCurriculum('mod-01')
    } else {
      openAuthModal('register')
    }
  }

  /**
   * Secondary CTA — pure discovery, no login needed.
   * Scrolls the page down to the LearnGrid section so the user can
   * browse lesson cards and get a feel for the course before committing.
   */
  const handleSeeInside = () => {
    const el = document.getElementById('learn-grid')
    if (el) {
      gsap.to(window, {
        scrollTo: { y: el, offsetY: 0 },
        duration: 0.8,
        ease: 'power2.inOut',
      })
    }
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const loadTl = gsap.timeline({ delay: 0.2 })

      loadTl
        .fromTo(h1Line1Ref.current,
          { y: 40, rotate: -1, opacity: 0 },
          { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        )
        .fromTo(h1Line2Ref.current,
          { y: 40, rotate: -1, opacity: 0 },
          { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.48'
        )
        .fromTo(bodyRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
          '-=0.3'
        )
        .fromTo(ctaRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
          '-=0.25'
        )
        .fromTo(ghostRef.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
          '-=0.25'
        )
        .fromTo(catRef.current,
          { x: '10vw', scale: 0.96, opacity: 0 },
          { x: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' },
          '-=0.5'
        )

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onLeaveBack: () => {
            gsap.set([h1Line1Ref.current, h1Line2Ref.current, bodyRef.current, ctaRef.current, ghostRef.current, catRef.current], {
              opacity: 1, x: 0, y: 0, scale: 1, rotate: 0
            })
          }
        }
      })

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

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`${className} flex items-center justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      {/* Subtle warm glow behind the cat */}
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

      {/* HEADLINE */}
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

      {/* BODY COPY */}
      <div ref={bodyRef} className="absolute left-[6vw] top-[38vh] md:top-[52vh] w-[80vw] md:w-[34vw]">
        <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(15px, 1.2vw, 18px)' }}>
          A friendly, practical course in Git & GitHub—built for beginners, taught like you're already on the team.
          All videos are free from the best educators on YouTube.
        </p>
      </div>

      {/* PRIMARY CTA — commits the user to starting lesson 1 */}
      <div ref={ctaRef} className="absolute left-[6vw] top-[52vh] md:top-[66vh]">
        <button
          onClick={handleStartLesson}
          className="bg-rose-punch text-white font-display font-semibold px-6 md:px-8 py-3 md:py-4 card-radius card-shadow
            hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300"
          style={{ fontSize: 'clamp(15px, 1.4vw, 20px)' }}>
          {isLoggedIn ? 'Start First Lesson' : 'Join Free & Start Learning'}
        </button>
      </div>

      {/* SECONDARY CTA — scrolls to lesson overview, no login needed */}
      <div ref={ghostRef} className="absolute left-[6vw] top-[64vh] md:top-[76vh]">
        <button
          onClick={handleSeeInside}
          className="flex items-center gap-1.5 text-white/60 font-accent text-xs uppercase tracking-[0.14em] hover:text-white transition-colors"
        >
          See what's inside
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* GITTER THE CAT — desktop only */}
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

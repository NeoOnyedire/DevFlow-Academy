/**
 * ============================================================================
 * BeforeAfterSection.tsx
 * ============================================================================
 *
 * "Do's & Don'ts" — a punchy comparison section showing bad vs good
 * Git practices through two side-by-side photo cards.
 *
 * Left card (Don'ts): messy desk, vague commits, committing to main
 * Right card (Do's): clean desk, clear messages, feature branches
 *
 * Each card has a color-coded chip (rose punch for Don'ts, lime for Do's)
 * and a list of practices. The visual contrast makes the lesson stick.
 *
 * MOBILE: Cards stack vertically (Don'ts on top, Do's below).
 * Pinned scroll animation is preserved on all screen sizes.
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { X, Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

/** Bad practices list */
const DONTS = ['vague messages', 'commits on main', 'no descriptions']

/** Good practices list */
const DOS = ['clear messages', 'feature branches', 'detailed PRs']

export default function BeforeAfterSection({ className = '' }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const dontCardRef = useRef<HTMLDivElement>(null)
  const doCardRef = useRef<HTMLDivElement>(null)
  const dontChipRef = useRef<HTMLDivElement>(null)
  const doChipRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          snap: {
            snapTo: [0.5],
            duration: 0.35,
            ease: 'power2.out',
          },
        }
      })

      // ---- ENTRANCE (0% - 30%) ----
      scrollTl
        // Headline drops in from top
        .fromTo(headlineRef.current,
          { y: '-40vh', scale: 0.9, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, ease: 'none' },
          0.06
        )
        // Don'ts card slides in from left
        .fromTo(dontCardRef.current,
          { x: '-70vw', rotate: -6, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'none' },
          0.10
        )
        // Do's card slides in from right
        .fromTo(doCardRef.current,
          { x: '70vw', rotate: 6, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'none' },
          0.12
        )
        // Chips scale in
        .fromTo(dontChipRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'none' },
          0.18
        )
        .fromTo(doChipRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'none' },
          0.20
        )

      // ---- SETTLE (30% - 70%) — static ----

      // ---- EXIT (70% - 100%) ----
      scrollTl
        .fromTo(headlineRef.current,
          { y: 0, opacity: 1 },
          { y: '-18vh', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .fromTo(dontCardRef.current,
          { x: 0, y: 0, opacity: 1 },
          { x: '-35vw', y: '14vh', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .fromTo(doCardRef.current,
          { x: 0, y: 0, opacity: 1 },
          { x: '35vw', y: '14vh', opacity: 0, ease: 'power2.in' },
          0.70
        )

    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="before-after"
      className={`${className} flex items-center justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      {/* Centered headline */}
      <div ref={headlineRef} className="absolute left-1/2 -translate-x-1/2" style={{ top: '6vh' }}>
        <h2 className="font-display font-bold text-white heading-responsive tracking-[0.02em] text-center"
          style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
          Do's & Don'ts
        </h2>
      </div>

      {/* Don'ts card — left (full width on mobile) */}
      <div
        ref={dontCardRef}
        className="absolute card-radius card-shadow overflow-hidden left-[6vw] md:left-[8vw]
          top-[18vh] md:top-[22vh] w-[42vw] md:w-[38vw] h-[55vh] md:h-[58vh]"
      >
        <img
          src="/before_after_dont.jpg"
          alt="Messy workspace - don'ts"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.85) contrast(1.05)' }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* Don'ts chip */}
        <div ref={dontChipRef} className="absolute top-3 left-3 md:top-4 md:left-4">
          <div className="bg-rose-punch text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-1.5 md:gap-2 font-display font-semibold text-xs md:text-sm">
            <X className="w-3 h-3 md:w-4 md:h-4" />
            Don'ts
          </div>
        </div>
        {/* Don'ts list */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
          {DONTS.map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5 md:mb-2">
              <span className="text-rose-punch font-bold text-base md:text-lg">-</span>
              <span className="text-white/90 font-medium text-xs md:text-base">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Do's card — right (full width on mobile, stacked below on mobile) */}
      <div
        ref={doCardRef}
        className="absolute card-radius card-shadow overflow-hidden right-[6vw] md:left-[54vw]
          top-[18vh] md:top-[22vh] w-[42vw] md:w-[38vw] h-[55vh] md:h-[58vh]"
      >
        <img
          src="/before_after_do.jpg"
          alt="Clean workspace - do's"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.85) contrast(1.05)' }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* Do's chip */}
        <div ref={doChipRef} className="absolute top-3 left-3 md:top-4 md:left-4">
          <div className="bg-lime text-[#2A2A2A] px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-1.5 md:gap-2 font-display font-semibold text-xs md:text-sm">
            <Check className="w-3 h-3 md:w-4 md:h-4" />
            Do's
          </div>
        </div>
        {/* Do's list */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
          {DOS.map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5 md:mb-2">
              <span className="text-lime font-bold text-base md:text-lg">+</span>
              <span className="text-white/90 font-medium text-xs md:text-base">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

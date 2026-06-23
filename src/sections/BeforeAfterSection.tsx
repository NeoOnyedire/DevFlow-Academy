/**
 * ============================================================================
 * BeforeAfterSection.tsx
 * ============================================================================
 *
 * "Do's & Don'ts" comparison section.
 *
 * Mobile layout fix: on screens narrower than 480px the two cards were
 * side-by-side at w-[42vw] which made text illegible. They now stack
 * vertically and each takes full width below the sm breakpoint.
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

const DONTS = ['vague messages', 'commits on main', 'no descriptions']
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
          start: 'top bottom',
          end: 'bottom top',
          toggleActions: 'play none none reverse',
          once: false,
        }
      })
      scrollTl
        .fromTo(headlineRef.current,
          { y: '-40vh', scale: 0.9, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, ease: 'none' }, 0.06)
        .fromTo(dontCardRef.current,
          { x: '-70vw', rotate: -6, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'none' }, 0.10)
        .fromTo(doCardRef.current,
          { x: '70vw', rotate: 6, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'none' }, 0.12)
        .fromTo(dontChipRef.current,
          { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none' }, 0.18)
        .fromTo(doChipRef.current,
          { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, ease: 'none' }, 0.20)
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
      {/* Headline */}
      <div ref={headlineRef} className="absolute left-1/2 -translate-x-1/2" style={{ top: '6vh' }}>
        <h2 className="font-display font-bold text-white tracking-[0.02em] text-center"
          style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
          Do's & Don'ts
        </h2>
      </div>

      {/* ── Desktop layout: side-by-side absolute cards ── */}
      <div className="hidden sm:block">
        {/* Don'ts card */}
        <div
          ref={dontCardRef}
          className="absolute card-radius card-shadow overflow-hidden left-[6vw] md:left-[8vw]
            top-[18vh] md:top-[22vh] w-[42vw] md:w-[38vw] h-[55vh] md:h-[58vh]"
        >
          <img src="/before_after_dont.jpg" alt="Messy workspace - don'ts"
            className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div ref={dontChipRef} className="absolute top-3 left-3 md:top-4 md:left-4">
            <div className="bg-rose-punch text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-1.5 font-display font-semibold text-xs md:text-sm">
              <X className="w-3 h-3 md:w-4 md:h-4" /> Don'ts
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
            {DONTS.map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5 md:mb-2">
                <span className="text-rose-punch font-bold text-base md:text-lg">-</span>
                <span className="text-white/90 font-medium text-xs md:text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Do's card */}
        <div
          ref={doCardRef}
          className="absolute card-radius card-shadow overflow-hidden right-[6vw] md:left-[54vw]
            top-[18vh] md:top-[22vh] w-[42vw] md:w-[38vw] h-[55vh] md:h-[58vh]"
        >
          <img src="/before_after_do.jpg" alt="Clean workspace - do's"
            className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div ref={doChipRef} className="absolute top-3 left-3 md:top-4 md:left-4">
            <div className="bg-lime text-[#2A2A2A] px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-1.5 font-display font-semibold text-xs md:text-sm">
              <Check className="w-3 h-3 md:w-4 md:h-4" /> Do's
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
            {DOS.map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5 md:mb-2">
                <span className="text-lime font-bold text-base md:text-lg">+</span>
                <span className="text-white/90 font-medium text-xs md:text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile layout: stacked vertical cards (< sm) ── */}
      <div className="sm:hidden absolute inset-x-[6vw] top-[14vh] flex flex-col gap-4">
        {/* Don'ts */}
        <div className="card-radius card-shadow overflow-hidden relative" style={{ height: '38vh' }}>
          <img src="/before_after_dont.jpg" alt="Messy workspace - don'ts"
            className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-3 left-3">
            <div className="bg-rose-punch text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 font-display font-semibold text-xs">
              <X className="w-3 h-3" /> Don'ts
            </div>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            {DONTS.map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <span className="text-rose-punch font-bold">-</span>
                <span className="text-white/90 font-medium text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Do's */}
        <div className="card-radius card-shadow overflow-hidden relative" style={{ height: '38vh' }}>
          <img src="/before_after_do.jpg" alt="Clean workspace - do's"
            className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-3 left-3">
            <div className="bg-lime text-[#2A2A2A] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-display font-semibold text-xs">
              <Check className="w-3 h-3" /> Do's
            </div>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            {DOS.map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <span className="text-lime font-bold">+</span>
                <span className="text-white/90 font-medium text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * BeforeAfterSection.tsx — "Do's & Don'ts"
 *
 * Rewritten to use CSS Grid so cards never bleed outside the section bounds.
 * The two photo cards sit in a two-column grid with the headline above.
 * No absolute positioning — safe to render adjacent to other sections.
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { X, Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props { className?: string }

const DONTS = ['vague messages', 'commits on main', 'no descriptions']
const DOS   = ['clear messages', 'feature branches', 'detailed PRs']

export default function BeforeAfterSection({ className = '' }: Props) {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const dontRef     = useRef<HTMLDivElement>(null)
  const doRef       = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          end: 'top 40%',
          toggleActions: 'play none none reverse',
        }
      })
      tl.fromTo(headlineRef.current,
          { y: -40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' })
        .fromTo(dontRef.current,
          { x: -60, rotate: -4, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')
        .fromTo(doRef.current,
          { x: 60, rotate: 4, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.5')
    }, section)
    return () => ctx.revert()
  }, [])

  const cardList = (items: string[], color: string, plus: boolean) => (
    <div className="absolute bottom-5 left-5 right-5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 mb-1.5">
          <span className="font-bold text-lg" style={{ color }}>{plus ? '+' : '-'}</span>
          <span className="text-white/90 font-medium text-sm md:text-base">{item}</span>
        </div>
      ))}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      id="before-after"
      className={`${className} py-20 md:py-28 px-[6vw]`}
    >
      {/* Headline */}
      <div ref={headlineRef} className="text-center mb-10 md:mb-14">
        <h2 className="font-display font-bold text-white tracking-[0.02em]"
          style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
          Do's & Don'ts
        </h2>
      </div>

      {/* Two-column card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Don'ts card */}
        <div ref={dontRef} className="relative card-radius card-shadow overflow-hidden"
          style={{ height: 'clamp(340px, 50vh, 520px)' }}>
          <img src="/before_after_dont.jpg" alt="Messy workspace"
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute top-4 left-4">
            <div className="bg-rose-punch text-white px-4 py-2 rounded-full flex items-center gap-2 font-display font-semibold text-sm">
              <X className="w-4 h-4" /> Don'ts
            </div>
          </div>
          {cardList(DONTS, '#FF4D6D', false)}
        </div>

        {/* Do's card */}
        <div ref={doRef} className="relative card-radius card-shadow overflow-hidden"
          style={{ height: 'clamp(340px, 50vh, 520px)' }}>
          <img src="/before_after_do.jpg" alt="Clean workspace"
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute top-4 left-4">
            <div className="bg-lime text-[#2A2A2A] px-4 py-2 rounded-full flex items-center gap-2 font-display font-semibold text-sm">
              <Check className="w-4 h-4" /> Do's
            </div>
          </div>
          {cardList(DOS, '#3CCF4A', true)}
        </div>
      </div>
    </section>
  )
}

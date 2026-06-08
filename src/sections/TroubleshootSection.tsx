/**
 * ============================================================================
 * TroubleshootSection.tsx
 * ============================================================================
 *
 * "Find Your Fix Fast" — a bold error-lookup section with a playful
 * emoji cipher riddle. Features a photo card and search CTA.
 *
 * The emoji riddle (🐙🐈🟰🙅☂️🐟) is a fun Easter egg that reads
 * as "OctoCat ≠ No Umbrella Fish" — pure nonsense that invites curiosity.
 *
 * MOBILE: Stacks vertically with image on top, text below.
 * Pinned scroll with 3-phase animation on desktop; simpler on mobile.
 *
 * Clicking "Open Troubleshooter" opens the curriculum panel.
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Search } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

/** The emoji riddle tokens */
const EMOJIS = ['🐙', '🐈', '🟰', '🙅', '☂️', '🐟']

export default function TroubleshootSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()

  const sectionRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const emojiTokensRef = useRef<(HTMLSpanElement | null)[]>([])

  /** Open curriculum panel or auth modal */
  const handleOpenTroubleshooter = () => {
    if (isLoggedIn) {
      openCurriculum('mod-01')
    } else {
      openAuthModal('register')
    }
  }

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
        // Photo card slides in from left
        .fromTo(photoRef.current,
          { x: '-55vw', rotate: -8, scale: 0.92, opacity: 0 },
          { x: 0, rotate: 0, scale: 1, opacity: 1, ease: 'power1.out' },
          0.06
        )
        // Heading slides in from right
        .fromTo(headingRef.current,
          { x: '45vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'power1.out' },
          0.08
        )
        // Subheading fades up
        .fromTo(subRef.current,
          { y: '14vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'power1.out' },
          0.14
        )

      // Emoji tokens appear one by one with stagger
      emojiTokensRef.current.forEach((token, i) => {
        if (!token) return
        scrollTl.fromTo(token,
          { y: '14vh', scale: 0.7, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, ease: 'none' },
          0.18 + i * 0.02
        )
      })

      // CTA fades in
      scrollTl.fromTo(ctaRef.current,
        { y: '18vh', scale: 0.96, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0.20
      )

      // ---- SETTLE (30% - 70%) — static ----

      // ---- EXIT (70% - 100%) ----
      scrollTl
        .fromTo(photoRef.current,
          { x: 0, opacity: 1 },
          { x: '-35vw', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .fromTo(headingRef.current,
          { x: 0, opacity: 1 },
          { x: '35vw', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .fromTo(subRef.current,
          { x: 0, opacity: 1 },
          { x: '35vw', opacity: 0, ease: 'power2.in' },
          0.72
        )
        .fromTo(emojiRef.current,
          { y: 0, opacity: 1 },
          { y: '-18vh', opacity: 0, ease: 'power2.in' },
          0.72
        )
        .fromTo(ctaRef.current,
          { x: 0, opacity: 1 },
          { x: '35vw', opacity: 0, ease: 'power2.in' },
          0.74
        )

    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="troubleshoot"
      className={`${className} flex items-center justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      {/* Photo card — left side (hidden on mobile, smaller on tablet) */}
      <div
        ref={photoRef}
        className="absolute card-radius card-shadow overflow-hidden card-outline hidden md:block"
        style={{ left: '6vw', top: '18vh', width: '36vw', height: '60vh' }}
      >
        <img
          src="/troubleshoot_photo.jpg"
          alt="Developer troubleshooting"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(0.85) contrast(1.05)' }}
        />
      </div>

      {/* Heading — right side (full width on mobile) */}
      <div ref={headingRef} className="absolute left-[6vw] md:left-[52vw] top-[10vh] md:top-[18vh] max-w-[80vw] md:max-w-[40vw]">
        <h2 className="font-display font-bold text-white heading-responsive tracking-[0.02em]"
          style={{ fontSize: 'clamp(34px, 5vw, 84px)' }}>
          Find Your Fix<br />Fast
        </h2>
      </div>

      {/* Subheading */}
      <div ref={subRef} className="absolute left-[6vw] md:left-[52vw] top-[28vh] md:top-[36vh] max-w-[80vw] md:max-w-[40vw]">
        <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
          Search symptoms. Get answers. Real workplace errors, explained like a teammate would. Free video solutions from expert educators.
        </p>
      </div>

      {/* Emoji riddle */}
      <div ref={emojiRef} className="absolute left-[6vw] md:left-[52vw] top-[44vh] md:top-[52vh] max-w-[80vw] md:max-w-[40vw]">
        <div className="bg-white/10 backdrop-blur-sm card-radius px-4 md:px-6 py-3 md:py-4 card-outline inline-flex items-center gap-2 md:gap-3">
          {EMOJIS.map((emoji, i) => (
            <span
              key={i}
              ref={el => { emojiTokensRef.current[i] = el }}
              className="text-2xl md:text-3xl"
              style={{ display: 'inline-block' }}
            >
              {emoji}
            </span>
          ))}
        </div>
        <p className="text-white/50 text-xs mt-3 font-accent uppercase tracking-wider">
          Can you decode the fix?
        </p>
      </div>

      {/* CTA button */}
      <div ref={ctaRef} className="absolute left-[6vw] md:left-[52vw] top-[56vh] md:top-[66vh]">
        <button
          onClick={handleOpenTroubleshooter}
          className="bg-rose-punch text-white font-display font-semibold px-5 md:px-7 py-3 md:py-3.5 card-radius card-shadow
            flex items-center gap-3 hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300"
          style={{ fontSize: 'clamp(13px, 1.2vw, 17px)' }}>
          <Search className="w-4 h-4 md:w-5 md:h-5" />
          {isLoggedIn ? 'Open Troubleshooter' : 'Join Free to Access'}
        </button>
      </div>
    </section>
  )
}

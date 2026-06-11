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
import { Search, Zap } from 'lucide-react'

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
          start: 'top bottom',
          end: 'bottom top',
          toggleActions: 'play none none reverse',
          once: false,
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

      // No exit animation — preserve the section content once it's in view.

    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="troubleshoot"
      className={`${className} flex justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      <div className="relative w-full max-w-[1360px] px-6 md:px-10 mx-auto flex flex-col md:flex-row items-center gap-10">
        {/* Photo card — left side (hidden on mobile, smaller on tablet) */}
        <div
          ref={photoRef}
          className="hidden md:block card-radius card-shadow overflow-hidden card-outline shrink-0"
          style={{ width: '36vw', maxWidth: '520px', minWidth: '340px', height: '60vh' }}
        >
          <img
            src="/troubleshoot_photo.jpg"
            alt="Developer troubleshooting"
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(0.85) contrast(1.05)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#F7B731]" />
              <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/70">This Week's Challenge</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[52vw] max-w-[640px]">
          {/* Heading */}
          <div ref={headingRef} className="max-w-full">
            <h2 className="font-display font-bold text-white heading-responsive tracking-[0.02em]"
              style={{ fontSize: 'clamp(34px, 5vw, 84px)' }}>
              Find Your Fix<br />Fast
            </h2>
          </div>

          {/* Subheading */}
          <div ref={subRef} className="mt-6 max-w-full">
            <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
              Search symptoms. Get answers. Real workplace errors, explained like a teammate would. Free video solutions from expert educators.
            </p>
          </div>

          {/* Emoji riddle */}
          <div ref={emojiRef} className="mt-10">
            <div className="bg-white/10 backdrop-blur-sm card-radius px-4 md:px-6 py-3 md:py-4 card-outline inline-flex items-center gap-2 md:gap-3 flex-wrap justify-center md:justify-start">
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
          <div ref={ctaRef} className="mt-8">
            <button
              onClick={handleOpenTroubleshooter}
              className="bg-rose-punch text-white font-display font-semibold px-5 md:px-7 py-3 md:py-3.5 card-radius card-shadow
                flex items-center gap-3 hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300"
              style={{ fontSize: 'clamp(13px, 1.2vw, 17px)' }}>
              <Search className="w-4 h-4 md:w-5 md:h-5" />
              {isLoggedIn ? 'Open Troubleshooter' : 'Join Free to Access'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

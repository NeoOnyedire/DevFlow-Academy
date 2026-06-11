/**
 * ============================================================================
 * ChallengeSection.tsx
 * ============================================================================
 *
 * "Repo Royale" — Weekly challenge section with a team photo,
 * challenge description, "Join" CTA, and a live leaderboard.
 *
 * Features parallax on the photo card and staggered entrance
 * for leaderboard rows. Fully responsive.
 *
 * Clicking "Join This Week" opens the curriculum panel (or auth modal).
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Zap, Crown } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

/** Demo leaderboard data */
const LEADERBOARD = [
  { rank: 1, name: 'Alex', points: 1240, color: '#F7B731' },
  { rank: 2, name: 'Sam', points: 1105, color: '#C0C0C0' },
  { rank: 3, name: 'Jordan', points: 980, color: '#CD7F32' },
  { rank: 4, name: 'Taylor', points: 875, color: '#888' },
  { rank: 5, name: 'Casey', points: 720, color: '#888' },
]

export default function ChallengeSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()

  const sectionRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<(HTMLDivElement | null)[]>([])

  /** Handle Join button click */
  const handleJoin = () => {
    if (isLoggedIn) {
      openCurriculum()
    } else {
      openAuthModal('register')
    }
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      // Photo parallax — subtle vertical movement on scroll
      gsap.fromTo(photoRef.current,
        { y: '6vh' },
        {
          y: '-6vh',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          }
        }
      )

      // Content block slides in from right
      gsap.fromTo(contentRef.current,
        { x: '12vw', opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 0.5,
          }
        }
      )

      // Leaderboard rows fade up with stagger
      rowsRef.current.forEach((row) => {
        if (!row) return
        gsap.fromTo(row,
          { y: '4vh', opacity: 0 },
          {
            y: 0, opacity: 1,
            scrollTrigger: {
              trigger: row,
              start: 'top 90%',
              end: 'top 70%',
              scrub: 0.5,
            }
          }
        )
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="challenge"
      className={`${className} relative`}
      style={{ padding: '8vh 0', minHeight: '100vh' }}
    >
      {/* Photo card — left side, hidden on small mobile */}
      <div
        ref={photoRef}
        className="absolute card-radius card-shadow overflow-hidden card-outline hidden md:block"
        style={{ left: '6vw', top: '14vh', width: '44vw', height: '58vh' }}
      >
        <img
          src="/challenge_team.jpg"
          alt="Team collaborating"
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

      {/* Right content area */}
      <div ref={contentRef} className="absolute left-[6vw] top-[8vh] md:left-[56vw] md:top-[16vh] max-w-[88vw] md:w-[38vw]">
        <h2 className="font-display font-bold text-white heading-responsive tracking-[0.02em] mb-3 md:mb-4"
          style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
          Repo Royale
        </h2>
        <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/60 mb-4 md:mb-6">
          Weekly challenge
        </p>
        <p className="text-white/80 leading-relaxed mb-6 md:mb-8 max-w-lg" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
          Solve the scenario. Post your answer. Climb the board. Every week, a new real-world Git puzzle drops. Join the community of learners.
        </p>

        <button
          onClick={handleJoin}
          className="bg-rose-punch text-white font-display font-semibold px-5 md:px-7 py-3 md:py-3.5 card-radius card-shadow
            hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300 mb-8 md:mb-10"
          style={{ fontSize: 'clamp(13px, 1.2vw, 17px)' }}>
          {isLoggedIn ? 'Join This Week' : 'Join Free & Play'}
        </button>

        {/* Leaderboard */}
        <div>
          <p className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/40 mb-3">Leaderboard</p>
          {LEADERBOARD.map((entry, i) => (
            <div
              key={entry.name}
              ref={el => { rowsRef.current[i] = el }}
              className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3 p-2.5 md:p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              {/* Rank */}
              <span className="font-display font-bold text-white/40 text-base md:text-lg w-5 md:w-6 text-center">
                {entry.rank}
              </span>
              {/* Avatar circle */}
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${entry.color}20` }}>
                {entry.rank === 1 ? (
                  <Crown className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: entry.color }} />
                ) : (
                  <span className="font-display font-bold text-xs" style={{ color: entry.color }}>
                    {entry.name[0]}
                  </span>
                )}
              </div>
              {/* Name */}
              <span className="font-medium text-white text-sm flex-1">{entry.name}</span>
              {/* Points */}
              <span className="font-display font-semibold text-white/80 text-sm">{entry.points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

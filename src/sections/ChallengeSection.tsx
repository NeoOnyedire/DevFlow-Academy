/**
 * ChallengeSection.tsx — "Repo Royale"
 *
 * Converted from absolute positioning to CSS Grid.
 * Left column: photo card. Right column: title + challenge + leaderboard.
 * No position:absolute on content — safe next to other sections.
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Zap, Crown, Check, Play } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props { className?: string }

const LEADERBOARD = [
  { rank: 1, name: 'Alex',   points: 1240, color: '#F7B731' },
  { rank: 2, name: 'Sam',    points: 1105, color: '#C0C0C0' },
  { rank: 3, name: 'Jordan', points: 980,  color: '#CD7F32' },
  { rank: 4, name: 'Taylor', points: 875,  color: '#888'    },
  { rank: 5, name: 'Casey',  points: 720,  color: '#888'    },
]

export default function ChallengeSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum, weeklyChallenge, hasCompletedWeeklyChallenge, completeWeeklyChallenge, rolePath, githubProfile } = useApp()

  const sectionRef  = useRef<HTMLDivElement>(null)
  const photoRef    = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)
  const rowsRef     = useRef<(HTMLDivElement | null)[]>([])

  const handleJoin = () => isLoggedIn ? openCurriculum(weeklyChallenge.moduleId) : openAuthModal('register')
  const handleComplete = () => isLoggedIn ? completeWeeklyChallenge() : openAuthModal('register')

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      gsap.fromTo(photoRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 45%', scrub: 0.5 } }
      )
      gsap.fromTo(contentRef.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 45%', scrub: 0.5 } }
      )
      rowsRef.current.forEach(row => {
        if (!row) return
        gsap.fromTo(row, { y: 20, opacity: 0 }, {
          y: 0, opacity: 1,
          scrollTrigger: { trigger: row, start: 'top 90%', end: 'top 70%', scrub: 0.5 }
        })
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="challenge"
      className={`${className} py-16 md:py-24 px-[6vw]`}
      style={{ minHeight: '100vh' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start max-w-6xl mx-auto">

        {/* Left: photo */}
        <div ref={photoRef} className="hidden md:block">
          <div className="card-radius card-shadow overflow-hidden card-outline w-full"
            style={{ height: 'clamp(400px, 55vh, 580px)' }}>
            <img src="/challenge_team.jpg" alt="Team collaborating"
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#F7B731]" />
              <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/70">This Week's Challenge</span>
            </div>
          </div>
        </div>

        {/* Right: content */}
        <div ref={contentRef}>
          <h2 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-3"
            style={{ fontSize: 'clamp(42px, 6vw, 88px)' }}>
            Repo Royale
          </h2>
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/60 mb-6">
            Dynamic weekly challenge | {rolePath.label}
          </p>

          {/* Challenge card */}
          <div className="mb-6 rounded-xl bg-white/10 p-5 card-outline">
            <p className="font-display text-2xl font-bold text-white mb-2">{weeklyChallenge.title}</p>
            <p className="text-sm leading-relaxed text-white/75 mb-3">{weeklyChallenge.brief}</p>
            <p className="text-xs font-accent uppercase tracking-[0.12em] text-white/40 mb-3">{weeklyChallenge.rolePrompt}</p>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-[#F7B731]">
              {weeklyChallenge.command}
            </div>
          </div>

          <p className="text-white/75 leading-relaxed mb-7 max-w-md" style={{ fontSize: 'clamp(14px, 1.1vw, 17px)' }}>
            This challenge changes each week and adapts to your role path. Connect GitHub to turn it into portfolio proof.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={handleJoin}
              className="bg-rose-punch text-white font-display font-semibold px-6 py-3 card-radius card-shadow
                hover:scale-105 transition-all flex items-center gap-2">
              <Play className="h-4 w-4" />
              {isLoggedIn ? 'Train for Challenge' : 'Join Free & Play'}
            </button>
            <button onClick={handleComplete}
              className={`font-display font-semibold px-6 py-3 card-radius transition-all flex items-center gap-2 ${
                hasCompletedWeeklyChallenge ? 'bg-[#3CCF4A]/20 text-[#3CCF4A]' : 'bg-white/10 text-white hover:bg-white/15'
              }`}>
              <Check className="h-4 w-4" />
              {hasCompletedWeeklyChallenge
                ? `Completed +${weeklyChallenge.reward}`
                : `Mark Complete +${weeklyChallenge.reward}`}
            </button>
          </div>

          {githubProfile && (
            <p className="mb-5 text-sm text-white/50">
              Connected to @{githubProfile.username}. Add your solution to a public repo for Career Mode credit.
            </p>
          )}

          {/* Leaderboard */}
          <p className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/40 mb-3">Leaderboard</p>
          {LEADERBOARD.map((entry, i) => (
            <div key={entry.name} ref={el => { rowsRef.current[i] = el }}
              className="flex items-center gap-4 mb-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <span className="font-display font-bold text-white/40 w-5 text-center">{entry.rank}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${entry.color}20` }}>
                {entry.rank === 1
                  ? <Crown className="w-4 h-4" style={{ color: entry.color }} />
                  : <span className="font-display font-bold text-xs" style={{ color: entry.color }}>{entry.name[0]}</span>
                }
              </div>
              <span className="font-medium text-white text-sm flex-1">{entry.name}</span>
              <span className="font-display font-semibold text-white/80 text-sm">{entry.points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

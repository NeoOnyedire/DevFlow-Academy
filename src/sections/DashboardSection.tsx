/**
 * ============================================================================
 * DashboardSection.tsx
 * ============================================================================
 *
 * "Your Progress" — a flowing (non-pinned) section that shows the user's
 * learning stats: lessons completed, streak, badges, leaderboard position,
 * skill map with progress bars, and next lesson.
 *
 * AUTH INTEGRATION:
 * - If logged in: shows real progress data from AppContext
 * - If not logged in: shows a login prompt instead of the dashboard
 *
 * MOBILE: Grid collapses to single column. Cards stack vertically.
 * All stats remain visible but reflow for narrow screens.
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { BookOpen, Flame, Award, Trophy, Map, ArrowRight, Lock } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

/** Skill progress data (percentage filled for each skill) */
const SKILLS = [
  { name: 'Staging', pct: 85 },
  { name: 'Branching', pct: 70 },
  { name: 'Merging', pct: 45 },
  { name: 'Review', pct: 20 },
]

export default function DashboardSection({ className = '' }: Props) {
  const { isLoggedIn, user, openAuthModal } = useAuth()
  const { completedModules, modules, openCurriculum } = useApp()

  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      // Heading slides in from left as it enters viewport
      gsap.fromTo(headingRef.current,
        { x: '-12vw', opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 80%',
            end: 'top 40%',
            scrub: 0.5,
          }
        }
      )

      // Each card fades up as it enters viewport
      cardsRef.current.forEach((card) => {
        if (!card) return
        gsap.fromTo(card,
          { y: '10vh', scale: 0.96, opacity: 0 },
          {
            y: 0, scale: 1, opacity: 1,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 55%',
              scrub: 0.5,
            }
          }
        )
      })
    }, section)

    return () => ctx.revert()
  }, [])

  // If not logged in, show a login prompt
  if (!isLoggedIn) {
    return (
      <section
        ref={sectionRef}
        id="dashboard"
        className={`${className} relative`}
        style={{ padding: '8vh 0', minHeight: '60vh' }}
      >
        <div className="px-[6vw] flex flex-col items-center justify-center text-center py-16">
          <div ref={headingRef}>
            <div className="w-16 h-16 rounded-full bg-[#4A2F2F] flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="font-display font-bold leading-[0.92] tracking-[0.02em] mb-4"
              style={{ fontSize: 'clamp(36px, 6vw, 72px)', color: '#2A2A2A' }}>
              Track Your Progress
            </h2>
            <p className="max-w-md mx-auto leading-relaxed mb-8" style={{ color: '#2A2A2Acc', fontSize: 'clamp(14px, 1.2vw, 17px)' }}>
              Create a free account to track your lessons, earn badges, and see how far you've come.
            </p>
            <button
              onClick={() => openAuthModal('register')}
              className="bg-rose-punch text-white font-display font-semibold px-8 py-4 card-radius card-shadow
                hover:scale-105 transition-all duration-300"
              style={{ fontSize: 'clamp(15px, 1.4vw, 18px)' }}>
              Join Free to Track Progress
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      id="dashboard"
      className={`${className} relative`}
      style={{ padding: '8vh 0', minHeight: '100vh' }}
    >
      {/* Heading */}
      <div ref={headingRef} className="px-[6vw] mb-8">
        <h2 className="font-display font-bold text-white leading-[0.92] tracking-[0.02em] mb-4"
          style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
          Your Progress
        </h2>
        <p className="text-white/80 max-w-[40vw] leading-relaxed hidden md:block" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'learner'}! Track lessons. Earn badges. Keep the streak.
        </p>
      </div>

      {/* Dashboard Grid — responsive: 2 cols on mobile, 4 on desktop */}
      <div className="px-[6vw] grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
        {/* Row 1: Stats cards */}
        {/* Lessons Completed */}
        <div
          ref={el => { cardsRef.current[0] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-[#F7B731]" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Lessons</span>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{completedModules.length}</p>
          <p className="text-white/60 text-xs md:text-sm">of {modules.length} completed</p>
        </div>

        {/* Current Streak */}
        <div
          ref={el => { cardsRef.current[1] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Streak</span>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{completedModules.length > 0 ? '3' : '0'}</p>
          <p className="text-white/60 text-xs md:text-sm">days</p>
        </div>

        {/* Badges Earned */}
        <div
          ref={el => { cardsRef.current[2] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Badges</span>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{Math.floor(completedModules.length / 2)}</p>
          <p className="text-white/60 text-xs md:text-sm">Earned</p>
        </div>

        {/* Leaderboard */}
        <div
          ref={el => { cardsRef.current[3] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#FF4D6D]/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-[#FF4D6D]" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Ranking</span>
          </div>
          <p className="font-display text-xl md:text-2xl font-bold text-white mb-1">Top {completedModules.length > 4 ? '8' : '25'}%</p>
          <p className="text-white/60 text-xs md:text-sm">this week</p>
        </div>

        {/* Row 2: Skill Map */}
        <div
          ref={el => { cardsRef.current[4] = el }}
          className="col-span-2 md:col-span-6 bg-card-dark card-radius card-shadow p-4 md:p-6 hover:scale-[1.01] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Map className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Skill Map</span>
          </div>
          <div className="grid grid-cols-2 md:flex md:gap-3 gap-2">
            {SKILLS.map((skill) => (
              <div key={skill.name} className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${skill.pct > 40 ? 'bg-lime' : 'bg-white/20'}`} />
                  <span className="text-white/80 text-xs md:text-sm font-medium">{skill.name}</span>
                </div>
                <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${skill.pct}%`,
                      backgroundColor: skill.pct > 40 ? 'var(--lime)' : 'rgba(255,255,255,0.2)'
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Lesson CTA */}
        <div
          ref={el => { cardsRef.current[5] = el }}
          onClick={() => openCurriculum()}
          className="col-span-2 md:col-span-6 bg-rose-punch card-radius card-shadow p-4 md:p-6 hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/70">Next Lesson</span>
            </div>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
            {completedModules.length < modules.length ? String(completedModules.length + 1).padStart(2, '0') : 'All Done!'}
          </p>
          <p className="text-white/90 text-sm md:text-lg font-medium">
            {completedModules.length < modules.length
              ? modules[completedModules.length]?.title || 'CI / CD Basics'
              : 'Course Complete!'}
          </p>
          <p className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">
            {completedModules.length < modules.length
              ? 'Click to continue learning'
              : 'Amazing work!'}
          </p>
        </div>
      </div>
    </section>
  )
}

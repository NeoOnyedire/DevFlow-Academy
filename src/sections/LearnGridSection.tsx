/**
 * ============================================================================
 * LearnGridSection.tsx
 * ============================================================================
 *
 * "From Push to Production" — a bright sun-yellow section showcasing
 * 5 lesson cards in a fanned, overlapping layout.
 *
 * Each card represents a curriculum module. Clicking a card opens the
 * curriculum panel at that specific module. If the user is not logged in,
 * clicking opens the auth modal instead.
 *
 * MOBILE: Cards stack vertically in a single column instead of the
 * desktop fanned layout. The heading becomes centered.
 *
 * Animation: 3-phase pinned scroll (entrance 0-30%, settle 30-70%, exit 70-100%)
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { GitCommit, GitBranch, GitPullRequest, Eye, Rocket } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

/** Lesson card data — maps to curriculum modules */
const lessons = [
  { num: '01', title: 'Stage & Commit', desc: 'Track your changes', tag: 'Basics', rotate: -6, icon: GitCommit, moduleId: 'mod-01' },
  { num: '02', title: 'Branching Basics', desc: 'Work in parallel', tag: 'Core', rotate: 4, icon: GitBranch, moduleId: 'mod-02' },
  { num: '03', title: 'Merge & Pull Requests', desc: 'Combine your work', tag: 'Team', rotate: -2, icon: GitPullRequest, moduleId: 'mod-03' },
  { num: '04', title: 'Review Like a Pro', desc: 'Give great feedback', tag: 'Culture', rotate: 5, icon: Eye, moduleId: 'mod-04' },
  { num: '05', title: 'Push to Live', desc: 'Deploy with confidence', tag: 'Deploy', rotate: -3, icon: Rocket, moduleId: 'mod-05' },
]

export default function LearnGridSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum, rolePath } = useApp()

  // Refs for GSAP targets
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  /** Handle card click — open curriculum or auth modal */
  const handleCardClick = (moduleId: string) => {
    if (isLoggedIn) {
      openCurriculum(moduleId)
    } else {
      openAuthModal('register')
    }
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      // Main pinned scroll timeline
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
      // Heading slides in from left
      scrollTl
        .fromTo(headingRef.current,
          { x: '-40vw', rotate: -2, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'power1.out' },
          0.05
        )
        // Subheading fades up
        .fromTo(subRef.current,
          { y: '12vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'power1.out' },
          0.12
        )

      // Cards enter staggered from right with rotation
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        const startTime = 0.08 + i * 0.04
        scrollTl.fromTo(card,
          { x: '40vw', rotate: 12, scale: 0.92, opacity: 0 },
          { x: 0, rotate: lessons[i].rotate, scale: 1, opacity: 1, ease: 'power1.out' },
          startTime
        )
      })

      // ---- SETTLE (30% - 70%) — static, no motion ----

      // ---- EXIT (70% - 100%) ----
      // Retain the entrance animation only and allow the section to remain visible.

    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="learn-grid"
      className={`${className} flex items-center justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      {/* Decorative rotating sun rays (desktop only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <svg className="absolute -right-[20vw] -top-[20vh] w-[80vw] h-[120vh] opacity-[0.08] animate-[spin_18s_linear_infinite]"
          viewBox="0 0 400 400">
          <defs>
            <radialGradient id="rayGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#6B4C4C" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          {[...Array(12)].map((_, i) => (
            <polygon key={i} points="200,200 220,0 180,0" fill="url(#rayGrad)"
              transform={`rotate(${i * 30} 200 200)`} />
          ))}
        </svg>
      </div>

      {/* ---- HEADING (left side desktop, top on mobile) ---- */}
      <div ref={headingRef} className="absolute left-[6vw] top-[8vh] max-w-[80vw] md:max-w-none">
        <h2 className="font-display font-bold text-white heading-responsive tracking-[0.02em]"
          style={{ fontSize: 'clamp(32px, 5.5vw, 76px)' }}>
          From Push to<br className="hidden md:block" /> Production
        </h2>
      </div>

      {/* ---- SUBHEADING ---- */}
      <div ref={subRef} className="absolute left-[6vw] top-[28vh] md:top-[30vh] max-w-[70vw] md:max-w-[48vw]">
        <p className="text-white/80 font-accent text-xs md:text-sm uppercase tracking-[0.14em]">
          {rolePath.label}: {rolePath.focus}
        </p>
      </div>

      {/* ---- LESSON CARDS (desktop: fanned absolute layout) ---- */}
      <div className="absolute hidden md:block" style={{ right: '4vw', top: '12vh', width: '52vw', height: '72vh' }}>
        {lessons.map((lesson, i) => {
          const Icon = lesson.icon
          // Each card has a unique position for the fanned layout
          const positions = [
            { left: '2%', top: '5%' },
            { left: '35%', top: '2%' },
            { left: '8%', top: '38%' },
            { left: '45%', top: '35%' },
            { left: '20%', top: '68%' },
          ]
          return (
            <div
              key={lesson.num}
              ref={el => { cardsRef.current[i] = el }}
              onClick={() => handleCardClick(lesson.moduleId)}
              className="absolute card-radius card-shadow cursor-pointer hover:scale-105 hover:z-10 transition-transform duration-300 overflow-hidden"
              style={{
                ...positions[i],
                width: 'min(220px, 18vw)',
                transform: `rotate(${lesson.rotate}deg)`,
                backgroundColor: 'var(--card-light)',
              }}
            >
              <div className="w-full h-28 overflow-hidden">
                <img src={`/learn_photo_0${(i % 3) + 1}.jpg`} alt={lesson.title}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="label-tag text-[#2A2A2A]/60">{lesson.num}</span>
                </div>
                <h3 className="font-display font-semibold text-[#2A2A2A] text-sm leading-tight mb-1">
                  {lesson.title}
                </h3>
                <p className="text-[#2A2A2A]/60 text-xs mb-2">{lesson.desc}</p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--sun-yellow)', color: '#2A2A2A' }}>
                  {lesson.tag}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ---- MOBILE LESSON CARDS (horizontal scroll strip) ---- */}
      <div className="md:hidden absolute left-[6vw] right-[6vw] top-[32vh] flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory
        scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {lessons.map((lesson) => {
          const Icon = lesson.icon
          return (
            <div
              key={lesson.num}
              onClick={() => handleCardClick(lesson.moduleId)}
              className="min-w-[200px] card-radius card-shadow cursor-pointer snap-start overflow-hidden"
              style={{ backgroundColor: 'var(--card-light)' }}
            >
              <div className="w-full h-24 overflow-hidden">
                <img src={`/learn_photo_01.jpg`} alt={lesson.title}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="label-tag text-[#2A2A2A]/60 text-[10px]">{lesson.num}</span>
                </div>
                <h3 className="font-display font-semibold text-[#2A2A2A] text-xs leading-tight mb-0.5">
                  {lesson.title}
                </h3>
                <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-accent font-semibold uppercase tracking-wider mt-1"
                  style={{ backgroundColor: 'var(--sun-yellow)', color: '#2A2A2A' }}>
                  {lesson.tag}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

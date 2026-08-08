/**
 * LearnGridSection.tsx — "From Push to Production"
 *
 * Layout rewrite: two-column CSS grid instead of all-absolute positioning.
 * Left column: heading + subheading (can never overlap cards).
 * Right column: fanned card stack.
 * Cards remain absolutely positioned *within* the right column container
 * so the fan effect is preserved but bounded.
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { GitCommit, GitBranch, GitPullRequest, Eye, Rocket } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props { className?: string }

const lessons = [
  { num: '01', title: 'Stage & Commit',       desc: 'Track your changes',     tag: 'Basics',  rotate: -6, icon: GitCommit,      moduleId: 'mod-01' },
  { num: '02', title: 'Branching Basics',      desc: 'Work in parallel',       tag: 'Core',    rotate:  4, icon: GitBranch,      moduleId: 'mod-02' },
  { num: '03', title: 'Merge & Pull Requests', desc: 'Combine your work',      tag: 'Team',    rotate: -2, icon: GitPullRequest, moduleId: 'mod-03' },
  { num: '04', title: 'Review Like a Pro',     desc: 'Give great feedback',    tag: 'Culture', rotate:  5, icon: Eye,            moduleId: 'mod-04' },
  { num: '05', title: 'Push to Live',          desc: 'Deploy with confidence', tag: 'Deploy',  rotate: -3, icon: Rocket,         moduleId: 'mod-05' },
]

// Fixed positions within the right-column container (percentage-based)
const CARD_POSITIONS = [
  { left: '2%',  top: '2%'  },
  { left: '36%', top: '0%'  },
  { left: '10%', top: '37%' },
  { left: '46%', top: '34%' },
  { left: '22%', top: '67%' },
]

export default function LearnGridSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum, rolePath } = useApp()

  const sectionRef  = useRef<HTMLDivElement>(null)
  const headingRef  = useRef<HTMLDivElement>(null)
  const subRef      = useRef<HTMLDivElement>(null)
  const cardsRef    = useRef<(HTMLDivElement | null)[]>([])

  const handleCardClick = (moduleId: string) => {
    if (isLoggedIn) openCurriculum(moduleId)
    else openAuthModal('register')
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          toggleActions: 'play none none reverse',
          once: false,
        }
      })
      tl.fromTo(headingRef.current,
          { x: '-40vw', rotate: -2, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'power1.out' }, 0.05)
        .fromTo(subRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, ease: 'power1.out' }, 0.14)

      cardsRef.current.forEach((card, i) => {
        if (!card) return
        tl.fromTo(card,
          { x: '30vw', rotate: 12, scale: 0.92, opacity: 0 },
          { x: 0, rotate: lessons[i].rotate, scale: 1, opacity: 1, ease: 'power1.out' },
          0.08 + i * 0.05)
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="learn-grid"
      className={`${className} relative overflow-hidden`}
      style={{ minHeight: '100vh' }}
    >
      {/* Decorative sun rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <svg className="absolute -right-[10vw] -top-[10vh] w-[70vw] h-[120vh] opacity-[0.07] animate-[spin_20s_linear_infinite]"
          viewBox="0 0 400 400">
          <defs>
            <radialGradient id="rayGrad2" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#6B4C4C" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          {[...Array(12)].map((_, i) => (
            <polygon key={i} points="200,200 220,0 180,0" fill="url(#rayGrad2)"
              transform={`rotate(${i * 30} 200 200)`} />
          ))}
        </svg>
      </div>

      {/* ── Two-column grid — left text, right cards ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen">

        {/* Left: heading + subheading, vertically centred */}
        <div className="flex flex-col justify-center px-[6vw] py-16 md:py-24">
          <div ref={headingRef}>
            <h2 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 76px)' }}>
              From Push to<br />Production
            </h2>
          </div>
          <div ref={subRef} className="max-w-xs">
            <p className="text-white/70 font-accent text-xs uppercase tracking-[0.14em] leading-relaxed">
              <span className="text-[#F7B731]">{rolePath.label}:</span> {rolePath.focus}
            </p>
          </div>
        </div>

        {/* Right: fanned cards, absolutely positioned inside this container */}
        <div className="relative hidden md:block">
          {lessons.map((lesson, i) => {
            const Icon = lesson.icon
            return (
              <div
                key={lesson.num}
                ref={el => { cardsRef.current[i] = el }}
                onClick={() => handleCardClick(lesson.moduleId)}
                className="absolute card-radius card-shadow cursor-pointer hover:scale-105 hover:z-10 transition-transform duration-300 overflow-hidden"
                style={{
                  ...CARD_POSITIONS[i],
                  width: 'min(210px, 15vw)',
                  transform: `rotate(${lesson.rotate}deg)`,
                  backgroundColor: 'var(--card-light)',
                }}
              >
                <div className="w-full h-28 overflow-hidden">
                  <img src={`/learn_photo_0${(i % 3) + 1}.jpg`} alt={lesson.title}
                    className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#2A2A2A]/50 text-[10px] font-accent font-semibold uppercase tracking-wider">{lesson.num}</span>
                  </div>
                  <h3 className="font-display font-semibold text-[#2A2A2A] text-sm leading-tight mb-1">{lesson.title}</h3>
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

        {/* Mobile: horizontal scroll strip */}
        <div className="md:hidden px-[6vw] pb-12 flex gap-3 overflow-x-auto snap-x snap-mandatory
          scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {lessons.map((lesson) => {
            const Icon = lesson.icon
            return (
              <div key={lesson.num} onClick={() => handleCardClick(lesson.moduleId)}
                className="min-w-[190px] card-radius card-shadow cursor-pointer snap-start overflow-hidden flex-shrink-0"
                style={{ backgroundColor: 'var(--card-light)' }}>
                <div className="w-full h-24 overflow-hidden">
                  <img src="/learn_photo_01.jpg" alt={lesson.title}
                    className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[#2A2A2A]/50 text-[10px] font-accent uppercase tracking-wider">{lesson.num}</span>
                  </div>
                  <h3 className="font-display font-semibold text-[#2A2A2A] text-xs leading-tight mb-1">{lesson.title}</h3>
                  <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-accent font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: 'var(--sun-yellow)', color: '#2A2A2A' }}>
                    {lesson.tag}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

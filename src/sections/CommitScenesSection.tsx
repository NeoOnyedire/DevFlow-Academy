/**
 * ============================================================================
 * CommitScenesSection.tsx
 * ============================================================================
 *
 * "What Do You Do?" — Interactive scenario cards.
 *
 * Mobile fix: the card strip was positioned at top-[40vh] which could
 * overlap the body text on short phones. It now sits below the body copy
 * using a flow layout on mobile rather than absolute positioning, giving
 * each element room to breathe regardless of screen height.
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { RotateCcw, GitMerge, MessageCircle } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

const SCENARIOS = [
  {
    title: 'You pushed to main',
    tags: ['revert', 'undo'],
    color: '#3CCF4A',
    icon: RotateCcw,
    img: '/commit_scene_01.jpg',
    position: { left: '54vw', top: '10vh' },
    width: '38vw',
    moduleId: 'mod-01',
  },
  {
    title: 'Merge conflict in styles.css',
    tags: ['resolve', 'review'],
    color: '#FF4D6D',
    icon: GitMerge,
    img: '/commit_scene_02.jpg',
    position: { left: '62vw', top: '38vh' },
    width: '30vw',
    moduleId: 'mod-03',
  },
  {
    title: 'Teammate broke the build',
    tags: ['rollback', 'communicate'],
    color: '#4A90D9',
    icon: MessageCircle,
    img: '/commit_scene_03.jpg',
    position: { left: '46vw', top: '62vh' },
    width: '36vw',
    moduleId: 'mod-04',
  },
]

export default function CommitScenesSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()

  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  const handleCardClick = (moduleId: string) => {
    if (isLoggedIn) openCurriculum(moduleId)
    else openAuthModal('register')
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
      scrollTl
        .fromTo(headingRef.current,
          { x: '-60vw', rotate: -2, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'none' }, 0.05)
        .fromTo(subRef.current,
          { x: '-60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' }, 0.10)
        .fromTo(bodyRef.current,
          { x: '-60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' }, 0.14)
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        scrollTl.fromTo(card,
          { x: '70vw', rotate: 10, scale: 0.88, opacity: 0 },
          { x: 0, rotate: (i - 1) * 2, scale: 1, opacity: 1, ease: 'none' },
          0.10 + i * 0.07)
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="commit-scenes"
      className={`${className} flex items-center justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      {/* ── Desktop: absolute positioned heading + cards ── */}
      <div className="hidden md:block">
        <div ref={headingRef} className="absolute left-[6vw] top-[8vh] md:top-[10vh]">
          <h2 className="font-display font-bold text-white tracking-[0.02em]"
            style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
            What Do You Do?
          </h2>
        </div>
        <div ref={subRef} className="absolute left-[6vw] top-[20vh] md:top-[26vh] max-w-[40vw]">
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/60">Commit Scenes</p>
        </div>
        <div ref={bodyRef} className="absolute left-[6vw] top-[26vh] md:top-[32vh] max-w-[32vw]">
          <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
            Pick the best move. Get feedback instantly. Learn by making decisions—just like on the job.
          </p>
        </div>

        {SCENARIOS.map((scenario, i) => {
          const Icon = scenario.icon
          return (
            <div
              key={i}
              ref={el => { cardsRef.current[i] = el }}
              onClick={() => handleCardClick(scenario.moduleId)}
              className="absolute card-radius card-shadow overflow-hidden cursor-pointer
                hover:scale-105 hover:z-10 transition-transform duration-300"
              style={{ ...scenario.position, width: scenario.width, backgroundColor: 'var(--card-light)' }}
            >
              <div className="w-full h-32 overflow-hidden relative">
                <img src={scenario.img} alt={scenario.title}
                  className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${scenario.color}30 100%)` }} />
              </div>
              <div className="p-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: scenario.color }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-display font-semibold text-[#2A2A2A] text-sm leading-tight mb-2">{scenario.title}</h3>
                <div className="flex gap-1.5">
                  {scenario.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-accent font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: `${scenario.color}20`, color: scenario.color }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Mobile: normal flow layout so nothing overlaps ── */}
      <div className="md:hidden w-full px-[6vw] flex flex-col gap-6 pt-[6vh]">
        <div ref={headingRef}>
          <h2 className="font-display font-bold text-white tracking-[0.02em] mb-2"
            style={{ fontSize: 'clamp(32px, 9vw, 56px)' }}>
            What Do You Do?
          </h2>
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/60 mb-3">Commit Scenes</p>
          <p className="text-white/80 leading-relaxed text-sm mb-4">
            Pick the best move. Get feedback instantly. Each scenario links to a free video lesson.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {SCENARIOS.map((scenario, i) => {
            const Icon = scenario.icon
            return (
              <div
                key={i}
                onClick={() => handleCardClick(scenario.moduleId)}
                className="card-radius card-shadow overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                style={{ backgroundColor: 'var(--card-light)' }}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: scenario.color }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-[#2A2A2A] text-sm leading-tight mb-1">{scenario.title}</h3>
                    <div className="flex gap-1.5">
                      {scenario.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full text-[9px] font-accent font-semibold uppercase tracking-wider"
                          style={{ backgroundColor: `${scenario.color}20`, color: scenario.color }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

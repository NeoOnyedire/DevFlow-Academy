/**
 * ============================================================================
 * CommitScenesSection.tsx
 * ============================================================================
 *
 * "What Do You Do?" — Interactive scenario cards that simulate real
 * workplace Git situations. Users pick a card to explore that scenario.
 *
 * Three scenarios:
 * 1. "You pushed to main" — teaches revert/undo
 * 2. "Merge conflict in styles.css" — teaches conflict resolution
 * 3. "Teammate broke the build" — teaches rollback/communication
 *
 * MOBILE: Cards stack vertically with full-width layout.
 * Each card click opens the curriculum panel at the relevant module.
 *
 * Animation: 3-phase pinned scroll with cards entering from right.
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

/** Scenario data — each maps to a curriculum module */
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

  /** Handle scenario card click */
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
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      })

      // ---- ENTRANCE (0% - 30%) ----
      // Left heading block slides in
      scrollTl
        .fromTo(headingRef.current,
          { x: '-60vw', rotate: -2, opacity: 0 },
          { x: 0, rotate: 0, opacity: 1, ease: 'none' },
          0.05
        )
        .fromTo(subRef.current,
          { x: '-60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0.10
        )
        .fromTo(bodyRef.current,
          { x: '-60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0.14
        )

      // Cards enter from right with stagger
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        scrollTl.fromTo(card,
          { x: '70vw', rotate: 10, scale: 0.88, opacity: 0 },
          { x: 0, rotate: (i - 1) * 2, scale: 1, opacity: 1, ease: 'none' },
          0.10 + i * 0.07
        )
      })

      // ---- SETTLE (30% - 70%) — static, hover handled by CSS ----

      // ---- EXIT (70% - 100%) ----
      scrollTl
        .fromTo(headingRef.current,
          { x: 0, opacity: 1 },
          { x: '-35vw', opacity: 0, ease: 'power2.in' },
          0.70
        )
        .fromTo(subRef.current,
          { x: 0, opacity: 1 },
          { x: '-35vw', opacity: 0, ease: 'power2.in' },
          0.71
        )
        .fromTo(bodyRef.current,
          { x: 0, opacity: 1 },
          { x: '-35vw', opacity: 0, ease: 'power2.in' },
          0.72
        )

      // Each card exits in its own direction
      const exitOffsets = [
        { x: '30vw', y: '-10vh' },
        { x: '40vw', y: '8vh' },
        { x: '20vw', y: '18vh' },
      ]

      cardsRef.current.forEach((card, i) => {
        if (!card) return
        scrollTl.fromTo(card,
          { x: 0, y: 0, opacity: 1 },
          { x: exitOffsets[i].x, y: exitOffsets[i].y, opacity: 0, ease: 'power2.in' },
          0.70
        )
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
      {/* ---- LEFT HEADING BLOCK ---- */}
      <div ref={headingRef} className="absolute left-[6vw] top-[8vh] md:top-[10vh]">
        <h2 className="font-display font-bold text-white leading-[0.92] tracking-[0.02em]"
          style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
          What Do You Do?
        </h2>
      </div>

      <div ref={subRef} className="absolute left-[6vw] top-[20vh] md:top-[26vh] max-w-[40vw]">
        <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/60">
          Commit Scenes
        </p>
      </div>

      <div ref={bodyRef} className="absolute left-[6vw] top-[26vh] md:top-[32vh] max-w-[80vw] md:max-w-[32vw]">
        <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
          Pick the best move. Get feedback instantly. Learn by making decisions—just like on the job.
          Each scenario links to a free video lesson.
        </p>
      </div>

      {/* ---- DESKTOP SCENARIO CARDS (absolute positioned) ---- */}
      <div className="hidden md:block">
        {SCENARIOS.map((scenario, i) => {
          const Icon = scenario.icon
          return (
            <div
              key={i}
              ref={el => { cardsRef.current[i] = el }}
              onClick={() => handleCardClick(scenario.moduleId)}
              className="absolute card-radius card-shadow overflow-hidden cursor-pointer
                hover:scale-105 hover:z-10 transition-transform duration-300"
              style={{
                ...scenario.position,
                width: scenario.width,
                backgroundColor: 'var(--card-light)',
              }}
            >
              <div className="w-full h-32 overflow-hidden relative">
                <img src={scenario.img} alt={scenario.title}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${scenario.color}30 100%)` }} />
              </div>
              <div className="p-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: scenario.color }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-display font-semibold text-[#2A2A2A] text-sm leading-tight mb-2">
                  {scenario.title}
                </h3>
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

      {/* ---- MOBILE SCENARIO CARDS (horizontal scroll) ---- */}
      <div className="md:hidden absolute left-[6vw] right-[6vw] top-[40vh] flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory
        scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {SCENARIOS.map((scenario, i) => {
          const Icon = scenario.icon
          return (
            <div
              key={i}
              onClick={() => handleCardClick(scenario.moduleId)}
              className="min-w-[260px] card-radius card-shadow overflow-hidden cursor-pointer snap-start"
              style={{ backgroundColor: 'var(--card-light)' }}
            >
              <div className="w-full h-28 overflow-hidden relative">
                <img src={scenario.img} alt={scenario.title}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${scenario.color}30 100%)` }} />
              </div>
              <div className="p-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5"
                  style={{ backgroundColor: scenario.color }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-display font-semibold text-[#2A2A2A] text-xs leading-tight mb-1.5">
                  {scenario.title}
                </h3>
                <div className="flex gap-1.5">
                  {scenario.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded-full text-[8px] font-accent font-semibold uppercase tracking-wider"
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
    </section>
  )
}

/**
 * CommitScenesSection.tsx — "What Do You Do?"
 *
 * Layout rewrite: two-column CSS grid.
 * Left: heading + label + body (flow, never overlaps).
 * Right: three scenario cards stacked with slight offsets.
 * No absolute positioning for text content.
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { RotateCcw, GitMerge, MessageCircle } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props { className?: string }

const SCENARIOS = [
  { title: 'You pushed to main',          tags: ['revert', 'undo'],           color: '#3CCF4A', icon: RotateCcw,    img: '/commit_scene_01.jpg', moduleId: 'mod-01' },
  { title: 'Merge conflict in styles.css', tags: ['resolve', 'review'],        color: '#FF4D6D', icon: GitMerge,     img: '/commit_scene_02.jpg', moduleId: 'mod-03' },
  { title: 'Teammate broke the build',     tags: ['rollback', 'communicate'],  color: '#4A90D9', icon: MessageCircle, img: '/commit_scene_03.jpg', moduleId: 'mod-04' },
]

// Slight visual offset for the stacked card effect on desktop
const CARD_OFFSETS = [
  { marginTop: '0px',   marginLeft: '8%',  rotate:  3 },
  { marginTop: '-40px', marginLeft: '0%',  rotate: -2 },
  { marginTop: '-20px', marginLeft: '12%', rotate:  1 },
]

export default function CommitScenesSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()

  const sectionRef  = useRef<HTMLDivElement>(null)
  const leftRef     = useRef<HTMLDivElement>(null)
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
      tl.fromTo(leftRef.current,
          { x: '-8vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'power1.out' }, 0.05)

      cardsRef.current.forEach((card, i) => {
        if (!card) return
        tl.fromTo(card,
          { x: '12vw', scale: 0.92, opacity: 0 },
          { x: 0, scale: 1, opacity: 1, ease: 'power1.out' },
          0.10 + i * 0.08)
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="commit-scenes"
      className={`${className} relative overflow-hidden`}
      style={{ minHeight: '100vh' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen items-center gap-8 px-[6vw] py-16 md:py-0">

        {/* Left: text content */}
        <div ref={leftRef} className="flex flex-col justify-center">
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/50 mb-3">
            Commit Scenes
          </p>
          <h2 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-6"
            style={{ fontSize: 'clamp(36px, 5.5vw, 88px)' }}>
            What Do<br />You Do?
          </h2>
          <p className="text-white/75 leading-relaxed max-w-md"
            style={{ fontSize: 'clamp(14px, 1.1vw, 18px)' }}>
            Pick the best move. Get feedback instantly. Learn by making decisions — just like on the job.
            Each scenario links to a free video lesson.
          </p>
        </div>

        {/* Right: stacked scenario cards — desktop */}
        <div className="hidden md:flex flex-col items-center justify-center py-16">
          <div className="relative w-full max-w-sm">
            {SCENARIOS.map((scenario, i) => {
              const Icon = scenario.icon
              return (
                <div
                  key={i}
                  ref={el => { cardsRef.current[i] = el }}
                  onClick={() => handleCardClick(scenario.moduleId)}
                  className="card-radius card-shadow overflow-hidden cursor-pointer
                    hover:scale-105 hover:z-10 transition-transform duration-300 relative"
                  style={{
                    marginTop: CARD_OFFSETS[i].marginTop,
                    marginLeft: CARD_OFFSETS[i].marginLeft,
                    transform: `rotate(${CARD_OFFSETS[i].rotate}deg)`,
                    backgroundColor: 'var(--card-light)',
                    zIndex: 3 - i,
                  }}
                >
                  <div className="w-full h-36 overflow-hidden relative">
                    <img src={scenario.img} alt={scenario.title}
                      className="w-full h-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                    <div className="absolute inset-0"
                      style={{ background: `linear-gradient(to bottom, transparent 40%, ${scenario.color}30 100%)` }} />
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: scenario.color }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
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
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: list layout */}
        <div className="md:hidden flex flex-col gap-3 pb-8">
          {SCENARIOS.map((scenario, i) => {
            const Icon = scenario.icon
            return (
              <div key={i} onClick={() => handleCardClick(scenario.moduleId)}
                className="card-radius card-shadow overflow-hidden cursor-pointer active:scale-[0.98] transition-transform flex items-center gap-3 p-3"
                style={{ backgroundColor: 'var(--card-light)' }}>
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: scenario.color }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
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
            )
          })}
        </div>
      </div>
    </section>
  )
}

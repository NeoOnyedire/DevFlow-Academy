/**
 * CommitScenesSection.tsx — "What Do You Do?"
 *
 * Cards are now larger with taller images (h-48 → much more visual impact).
 * The right column uses max-w-lg instead of max-w-sm so cards fill the
 * available space on wide viewports.
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
  { title: 'You pushed to main',           tags: ['revert', 'undo'],          color: '#3CCF4A', icon: RotateCcw,     img: '/commit_scene_01.jpg', moduleId: 'mod-01' },
  { title: 'Merge conflict in styles.css',  tags: ['resolve', 'review'],       color: '#FF4D6D', icon: GitMerge,      img: '/commit_scene_02.jpg', moduleId: 'mod-03' },
  { title: 'Teammate broke the build',      tags: ['rollback', 'communicate'], color: '#4A90D9', icon: MessageCircle, img: '/commit_scene_03.jpg', moduleId: 'mod-04' },
]

const CARD_OFFSETS = [
  { mt: '0px',   ml: '6%',  rot:  3 },
  { mt: '-50px', ml: '0%',  rot: -2 },
  { mt: '-30px', ml: '10%', rot:  1.5 },
]

export default function CommitScenesSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()

  const sectionRef = useRef<HTMLDivElement>(null)
  const leftRef    = useRef<HTMLDivElement>(null)
  const cardsRef   = useRef<(HTMLDivElement | null)[]>([])

  const handleClick = (moduleId: string) =>
    isLoggedIn ? openCurriculum(moduleId) : openAuthModal('register')

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', toggleActions: 'play none none reverse' }
      })
      tl.fromTo(leftRef.current, { x: -40, opacity: 0 }, { x: 0, opacity: 1, ease: 'power2.out' }, 0.05)
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        tl.fromTo(card, { x: 40, scale: 0.94, opacity: 0 }, { x: 0, scale: 1, opacity: 1, ease: 'power2.out' }, 0.1 + i * 0.09)
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="commit-scenes"
      className={`${className} py-16 md:py-24 px-[6vw]`}
      style={{ minHeight: '100vh' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center max-w-6xl mx-auto">

        {/* Left: text */}
        <div ref={leftRef} className="flex flex-col justify-center">
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/50 mb-3">Commit Scenes</p>
          <h2 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-6"
            style={{ fontSize: 'clamp(40px, 5.5vw, 88px)' }}>
            What Do<br />You Do?
          </h2>
          <p className="text-white/75 leading-relaxed max-w-md" style={{ fontSize: 'clamp(14px, 1.1vw, 18px)' }}>
            Pick the best move. Get feedback instantly. Learn by making decisions — just like on the job.
            Each scenario links to a free video lesson.
          </p>
        </div>

        {/* Right: stacked cards — desktop, much larger */}
        <div className="hidden md:block">
          <div className="relative" style={{ paddingBottom: '40px' }}>
            {SCENARIOS.map((scenario, i) => {
              const Icon = scenario.icon
              return (
                <div
                  key={i}
                  ref={el => { cardsRef.current[i] = el }}
                  onClick={() => handleClick(scenario.moduleId)}
                  className="card-radius card-shadow overflow-hidden cursor-pointer
                    hover:scale-[1.03] hover:z-10 transition-transform duration-300 relative"
                  style={{
                    marginTop: CARD_OFFSETS[i].mt,
                    marginLeft: CARD_OFFSETS[i].ml,
                    transform: `rotate(${CARD_OFFSETS[i].rot}deg)`,
                    backgroundColor: 'var(--card-light)',
                    zIndex: 3 - i,
                    maxWidth: '420px',
                  }}
                >
                  {/* Taller image for more visual impact */}
                  <div className="w-full overflow-hidden relative" style={{ height: '200px' }}>
                    <img src={scenario.img} alt={scenario.title}
                      className="w-full h-full object-cover"
                      style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                    <div className="absolute inset-0"
                      style={{ background: `linear-gradient(to bottom, transparent 50%, ${scenario.color}25 100%)` }} />
                  </div>
                  <div className="p-5 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: scenario.color }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-[#2A2A2A] text-base leading-tight mb-2">
                        {scenario.title}
                      </h3>
                      <div className="flex gap-2">
                        {scenario.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider"
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

        {/* Mobile: list */}
        <div className="md:hidden flex flex-col gap-3">
          {SCENARIOS.map((scenario, i) => {
            const Icon = scenario.icon
            return (
              <div key={i} onClick={() => handleClick(scenario.moduleId)}
                className="card-radius card-shadow overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                style={{ backgroundColor: 'var(--card-light)' }}>
                <div className="w-full overflow-hidden" style={{ height: '140px' }}>
                  <img src={scenario.img} alt={scenario.title}
                    className="w-full h-full object-cover"
                    style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
                </div>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: scenario.color }}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-[#2A2A2A] text-sm leading-tight mb-1">{scenario.title}</h3>
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
    </section>
  )
}

/**
 * HeroSection.tsx
 *
 * Layout: CSS Grid on both mobile and desktop — no absolute positioning
 * for content. This eliminates all overlap issues since elements flow
 * naturally. The cat image sits in column 2 on desktop, column 1 on mobile.
 *
 * GSAP still animates elements in on load and out on scroll — it uses
 * refs to the grid children, not the section itself for positioning.
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { ChevronDown, GitBranch, GitMerge, Zap, Award } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

interface Props { className?: string }

const LEARN_PILLS = [
  { icon: GitBranch, label: 'Branching & commits' },
  { icon: GitMerge,  label: 'Merge conflicts'     },
  { icon: Zap,       label: 'CI / CD basics'      },
  { icon: Award,     label: 'Portfolio proof'      },
]

export default function HeroSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum, completedModules, modules } = useApp()

  const sectionRef = useRef<HTMLDivElement>(null)
  const leftRef    = useRef<HTMLDivElement>(null)   // entire left column
  const catRef     = useRef<HTMLDivElement>(null)   // right column cat

  const handleStartLesson = () => {
    if (isLoggedIn) openCurriculum('mod-01')
    else openAuthModal('register')
  }

  const handleSeeInside = () => {
    const el = document.getElementById('learn-grid')
    if (el) gsap.to(window, { scrollTo: { y: el, offsetY: 0 }, duration: 0.8, ease: 'power2.inOut' })
  }

  const ctaLabel = isLoggedIn && completedModules.length > 0
    ? `Continue — Module ${completedModules.length + 1}`
    : isLoggedIn ? 'Start First Lesson' : 'Join Free & Start Learning'

  const progressPct = modules.length > 0
    ? Math.round((completedModules.length / modules.length) * 100) : 0

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      // Entrance: left slides up, cat slides in from right
      gsap.fromTo(leftRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.15 }
      )
      gsap.fromTo(catRef.current,
        { x: 60, scale: 0.96, opacity: 0 },
        { x: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.4)', delay: 0.35 }
      )

      // Scroll exit
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onLeaveBack: () => {
            gsap.set([leftRef.current, catRef.current], { opacity: 1, x: 0, y: 0, scale: 1 })
          }
        }
      })
      scrollTl
        .fromTo(leftRef.current,  { y: 0, opacity: 1 }, { y: '18vh', opacity: 0, ease: 'power2.in' }, 0.65)
        .fromTo(catRef.current,   { x: 0, scale: 1, opacity: 1 }, { x: '20vw', scale: 1.04, opacity: 0, ease: 'power2.in' }, 0.65)
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`${className} relative`}
      style={{ minHeight: '100vh' }}
    >
      {/* Warm glow */}
      <div className="absolute pointer-events-none right-0 top-0 w-1/2 h-full hidden md:block"
        style={{ background: 'radial-gradient(ellipse at 70% 40%, rgba(247,183,49,0.12) 0%, transparent 65%)' }} />

      {/* Two-column grid — single column on mobile */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen px-[6vw] md:px-0">

        {/* ── Left column ── */}
        <div
          ref={leftRef}
          className="flex flex-col justify-center py-16 md:py-0 md:pl-[6vw] md:pr-8"
        >
          {/* Cat — mobile only, shown above headline */}
          <div className="md:hidden flex justify-center mb-8">
            <img src="/hero_cat.png" alt="Gitter the cat mascot" className="w-44 h-auto drop-shadow-xl" />
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold text-white tracking-[0.02em] leading-none mb-6"
            style={{ fontSize: 'clamp(44px, 6.5vw, 108px)' }}
          >
            Git yourself<br />Repo-Ready.
          </h1>

          {/* Body */}
          <p className="text-white/80 leading-relaxed mb-4 max-w-lg"
            style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}>
            A friendly, practical course in Git & GitHub — built for beginners, taught like you're already on the team.
          </p>

          {/* Meta strip */}
          <div className="flex items-center gap-3 text-white/40 text-xs font-accent uppercase tracking-[0.12em] mb-8">
            <span>~7 hrs</span>
            <span className="text-white/20">·</span>
            <span>8 modules</span>
            <span className="text-white/20">·</span>
            <span className="text-[#3CCF4A] font-semibold">Free</span>
            {isLoggedIn && completedModules.length > 0 && (
              <><span className="text-white/20">·</span>
              <span className="text-[#F7B731]">{progressPct}% done</span></>
            )}
          </div>

          {/* Primary CTA */}
          <div className="mb-6">
            <button
              onClick={handleStartLesson}
              className="bg-rose-punch text-white font-display font-semibold card-radius card-shadow
                hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300
                px-8 py-4 text-lg"
            >
              {ctaLabel}
            </button>
          </div>

          {/* What you'll learn pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {LEARN_PILLS.map(({ icon: Icon, label }) => (
              <div key={label}
                className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5">
                <Icon className="w-3 h-3 text-[#F7B731]" />
                <span className="text-white/65 text-xs font-accent">{label}</span>
              </div>
            ))}
          </div>

          {/* Secondary CTA */}
          <button
            onClick={handleSeeInside}
            className="flex items-center gap-1.5 text-white/50 font-accent text-xs uppercase tracking-[0.14em] hover:text-white transition-colors w-fit"
          >
            See what's inside <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Right column — cat, desktop only ── */}
        <div
          ref={catRef}
          className="hidden md:flex items-center justify-center pr-[4vw]"
        >
          <img
            src="/hero_cat.png"
            alt="Gitter the cat mascot"
            className="w-full max-w-lg h-auto"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
          />
        </div>
      </div>
    </section>
  )
}

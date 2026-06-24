/**
 * HeroSection.tsx
 *
 * Layout strategy:
 * - Mobile (<md): natural flex-column flow — no absolutes, content stacks
 *   cleanly, cat shows as a smaller inline image above the headline
 * - Desktop (md+): absolute positioning as before but with safer spacing
 *   so body text never overlaps the headline at intermediate widths
 *
 * The key insight: absolute + vh values break at widths where the headline
 * wraps to 3 lines. Switching mobile to flow layout fixes all overlap issues.
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

  const sectionRef  = useRef<HTMLDivElement>(null)
  // Desktop animation refs
  const h1Line1Ref  = useRef<HTMLDivElement>(null)
  const h1Line2Ref  = useRef<HTMLDivElement>(null)
  const bodyRef     = useRef<HTMLDivElement>(null)
  const metaRef     = useRef<HTMLDivElement>(null)
  const ctaRef      = useRef<HTMLDivElement>(null)
  const pillsRef    = useRef<HTMLDivElement>(null)
  const ghostRef    = useRef<HTMLDivElement>(null)
  const catRef      = useRef<HTMLDivElement>(null)
  // Mobile block (animated as one unit)
  const mobileRef   = useRef<HTMLDivElement>(null)

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
    ? Math.round((completedModules.length / modules.length) * 100)
    : 0

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      // ── Desktop entrance ──
      const loadTl = gsap.timeline({ delay: 0.2 })
      loadTl
        .fromTo(h1Line1Ref.current, { y: 40, rotate: -1, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        .fromTo(h1Line2Ref.current, { y: 40, rotate: -1, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.48')
        .fromTo(bodyRef.current,    { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.3')
        .fromTo(metaRef.current,    { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3,  ease: 'power2.out' }, '-=0.2')
        .fromTo(ctaRef.current,     { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.25')
        .fromTo(pillsRef.current,   { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.2')
        .fromTo(ghostRef.current,   { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.2')
        .fromTo(catRef.current,     { x: '10vw', scale: 0.96, opacity: 0 }, { x: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' }, '-=0.5')

      // Mobile entrance
      gsap.fromTo(mobileRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.3 })

      // ── Scroll exit ──
      const desktopEls = [h1Line1Ref, h1Line2Ref, bodyRef, metaRef, ctaRef, pillsRef, ghostRef, catRef].map(r => r.current)
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onLeaveBack: () => {
            gsap.set(desktopEls, { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 })
            gsap.set(mobileRef.current, { opacity: 1, y: 0 })
          }
        }
      })
      scrollTl
        .fromTo([h1Line1Ref.current, h1Line2Ref.current], { x: 0, opacity: 1 }, { x: '-55vw', opacity: 0, ease: 'power2.in' }, 0.70)
        .fromTo([bodyRef.current, metaRef.current],        { y: 0, opacity: 1 }, { y: '22vh',  opacity: 0, ease: 'power2.in' }, 0.72)
        .fromTo([ctaRef.current, pillsRef.current, ghostRef.current], { y: 0, opacity: 1 }, { y: '22vh', opacity: 0, ease: 'power2.in' }, 0.74)
        .fromTo(catRef.current,    { x: 0, scale: 1, opacity: 1 }, { x: '35vw', scale: 1.04, opacity: 0, ease: 'power2.in' }, 0.70)
        .fromTo(mobileRef.current, { y: 0, opacity: 1 }, { y: '22vh', opacity: 0, ease: 'power2.in' }, 0.70)
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`${className} relative overflow-hidden`}
      style={{ minHeight: '100vh' }}
    >
      {/* Warm glow behind cat — desktop only */}
      <div className="absolute pointer-events-none hidden md:block"
        style={{ right: '8vw', top: '12vh', width: '42vw', height: '70vh',
          background: 'radial-gradient(ellipse at center, rgba(247,183,49,0.15) 0%, transparent 70%)' }} />

      {/* ══════════════════════════════════════
          MOBILE LAYOUT — natural flow, no absolutes
          Shows from top: cat · headline · body · meta · CTA · pills · ghost
          ══════════════════════════════════════ */}
      <div ref={mobileRef} className="md:hidden flex flex-col min-h-screen px-6 pt-10 pb-8">
        {/* Small cat illustration at the top */}
        <div className="flex justify-center mb-6">
          <img
            src="/hero_cat.png"
            alt="Gitter the cat mascot"
            className="w-40 h-auto drop-shadow-xl"
          />
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-white tracking-[0.02em] mb-4 leading-none"
          style={{ fontSize: 'clamp(44px, 13vw, 72px)' }}>
          Git yourself<br />Repo-Ready.
        </h1>

        {/* Body */}
        <p className="text-white/75 leading-relaxed mb-3 text-base max-w-sm">
          A friendly, practical course in Git & GitHub — built for beginners, taught like you're already on the team.
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-white/40 text-xs font-accent uppercase tracking-[0.1em] mb-6">
          <span>~7 hrs</span>
          <span className="text-white/20">·</span>
          <span>8 modules</span>
          <span className="text-white/20">·</span>
          <span className="text-[#3CCF4A] font-semibold">Free</span>
          {isLoggedIn && completedModules.length > 0 && (
            <><span className="text-white/20">·</span><span className="text-[#F7B731]">{progressPct}% done</span></>
          )}
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleStartLesson}
          className="bg-rose-punch text-white font-display font-semibold px-7 py-4 rounded-2xl card-shadow
            hover:scale-105 active:scale-95 transition-all duration-200 text-lg mb-4 w-fit">
          {ctaLabel}
        </button>

        {/* Pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {LEARN_PILLS.map(({ icon: Icon, label }) => (
            <div key={label}
              className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5">
              <Icon className="w-3 h-3 text-[#F7B731]" />
              <span className="text-white/60 text-xs font-accent">{label}</span>
            </div>
          ))}
        </div>

        {/* Secondary */}
        <button onClick={handleSeeInside}
          className="flex items-center gap-1.5 text-white/40 font-accent text-xs uppercase tracking-[0.14em] hover:text-white transition-colors">
          See what's inside <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP LAYOUT — absolute positioned
          Safe gaps: headline ends ~28vh, body starts 54vh (generous gap)
          ══════════════════════════════════════ */}

      {/* Headline — starts at 12vh, large clamp won't exceed ~28vh at any reasonable width */}
      <div className="absolute left-[6vw] top-[12vh] w-[55vw] hidden md:block">
        <div ref={h1Line1Ref} className="font-display font-bold text-white tracking-[0.02em] leading-none"
          style={{ fontSize: 'clamp(52px, 7.5vw, 120px)' }}>
          Git yourself
        </div>
        <div ref={h1Line2Ref} className="font-display font-bold text-white tracking-[0.02em] leading-none"
          style={{ fontSize: 'clamp(52px, 7.5vw, 120px)' }}>
          Repo-Ready.
        </div>
      </div>

      {/* Body — starts at 48vh, well below the headline */}
      <div ref={bodyRef} className="absolute left-[6vw] top-[48vh] w-[34vw] hidden md:block">
        <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}>
          A friendly, practical course in Git & GitHub — built for beginners, taught like you're already on the team.
        </p>
      </div>

      {/* Meta strip */}
      <div ref={metaRef} className="absolute left-[6vw] top-[57vh] hidden md:block">
        <div className="flex items-center gap-3 text-white/40 text-xs font-accent uppercase tracking-[0.12em]">
          <span>~7 hrs</span>
          <span className="text-white/20">·</span>
          <span>8 modules</span>
          <span className="text-white/20">·</span>
          <span className="text-[#3CCF4A] font-semibold">Free</span>
          {isLoggedIn && completedModules.length > 0 && (
            <><span className="text-white/20">·</span><span className="text-[#F7B731]">{progressPct}% done</span></>
          )}
        </div>
      </div>

      {/* Primary CTA */}
      <div ref={ctaRef} className="absolute left-[6vw] top-[63vh] hidden md:block">
        <button
          onClick={handleStartLesson}
          className="bg-rose-punch text-white font-display font-semibold px-8 py-4 card-radius card-shadow
            hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300"
          style={{ fontSize: 'clamp(15px, 1.4vw, 20px)' }}>
          {ctaLabel}
        </button>
      </div>

      {/* Pills */}
      <div ref={pillsRef} className="absolute left-[6vw] top-[74vh] w-[38vw] hidden md:block">
        <div className="flex flex-wrap gap-2">
          {LEARN_PILLS.map(({ icon: Icon, label }) => (
            <div key={label}
              className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5">
              <Icon className="w-3 h-3 text-[#F7B731]" />
              <span className="text-white/65 text-xs font-accent">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary CTA */}
      <div ref={ghostRef} className="absolute left-[6vw] top-[83vh] hidden md:block">
        <button onClick={handleSeeInside}
          className="flex items-center gap-1.5 text-white/50 font-accent text-xs uppercase tracking-[0.14em] hover:text-white transition-colors">
          See what's inside <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cat — desktop only */}
      <div ref={catRef} className="absolute hidden md:block" style={{ right: '6vw', top: '14vh', width: '38vw', maxWidth: '520px' }}>
        <img src="/hero_cat.png" alt="Gitter the cat mascot" className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }} />
      </div>
    </section>
  )
}

/**
 * HeroSection.tsx
 *
 * Changes:
 * - Added a scannable "what you'll learn" strip of 4 pills below the CTAs
 *   so guests see the value proposition in <5 seconds without scrolling
 * - Shows total time commitment ("~7 hrs · 8 modules · free")
 * - Completion badge in the CTA area when the user has completed modules
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
  const h1Line1Ref  = useRef<HTMLDivElement>(null)
  const h1Line2Ref  = useRef<HTMLDivElement>(null)
  const bodyRef     = useRef<HTMLDivElement>(null)
  const metaRef     = useRef<HTMLDivElement>(null)
  const ctaRef      = useRef<HTMLDivElement>(null)
  const pillsRef    = useRef<HTMLDivElement>(null)
  const ghostRef    = useRef<HTMLDivElement>(null)
  const catRef      = useRef<HTMLDivElement>(null)

  const allRefs = [h1Line1Ref, h1Line2Ref, bodyRef, metaRef, ctaRef, pillsRef, ghostRef, catRef]

  const handleStartLesson = () => {
    if (isLoggedIn) openCurriculum('mod-01')
    else openAuthModal('register')
  }

  const handleSeeInside = () => {
    const el = document.getElementById('learn-grid')
    if (el) gsap.to(window, { scrollTo: { y: el, offsetY: 0 }, duration: 0.8, ease: 'power2.inOut' })
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const loadTl = gsap.timeline({ delay: 0.2 })
      loadTl
        .fromTo(h1Line1Ref.current, { y: 40, rotate: -1, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        .fromTo(h1Line2Ref.current, { y: 40, rotate: -1, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.48')
        .fromTo(bodyRef.current,    { y: 18, opacity: 0 },              { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.3')
        .fromTo(metaRef.current,    { y: 18, opacity: 0 },              { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.2')
        .fromTo(ctaRef.current,     { y: 18, opacity: 0 },              { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.25')
        .fromTo(pillsRef.current,   { y: 18, opacity: 0 },              { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.2')
        .fromTo(ghostRef.current,   { y: 18, opacity: 0 },              { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, '-=0.2')
        .fromTo(catRef.current,     { x: '10vw', scale: 0.96, opacity: 0 }, { x: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' }, '-=0.5')

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onLeaveBack: () => {
            gsap.set(allRefs.map(r => r.current), { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 })
          }
        }
      })
      scrollTl
        .fromTo([h1Line1Ref.current, h1Line2Ref.current], { x: 0, opacity: 1 }, { x: '-55vw', opacity: 0, ease: 'power2.in' }, 0.70)
        .fromTo([bodyRef.current, metaRef.current],        { y: 0, opacity: 1 }, { y: '22vh', opacity: 0, ease: 'power2.in' }, 0.72)
        .fromTo([ctaRef.current, pillsRef.current, ghostRef.current], { y: 0, opacity: 1 }, { y: '22vh', opacity: 0, ease: 'power2.in' }, 0.74)
        .fromTo(catRef.current,  { x: 0, scale: 1, opacity: 1 },     { x: '35vw', scale: 1.04, opacity: 0, ease: 'power2.in' }, 0.70)
    }, section)

    return () => ctx.revert()
  }, [])

  const progressPct = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`${className} flex items-center justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      <div className="absolute pointer-events-none hidden md:block"
        style={{ right: '8vw', top: '12vh', width: '42vw', height: '70vh',
          background: 'radial-gradient(ellipse at center, rgba(247, 183, 49, 0.15) 0%, transparent 70%)' }} />

      {/* Headline */}
      <div className="absolute left-[6vw] top-[10vh] w-[88vw] md:w-[70vw]">
        <div ref={h1Line1Ref} className="font-display font-bold text-white tracking-[0.02em]"
          style={{ fontSize: 'clamp(42px, 9vw, 132px)' }}>
          Git yourself
        </div>
        <div ref={h1Line2Ref} className="font-display font-bold text-white tracking-[0.02em]"
          style={{ fontSize: 'clamp(42px, 9vw, 132px)' }}>
          Repo-Ready.
        </div>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="absolute left-[6vw] top-[38vh] md:top-[52vh] w-[80vw] md:w-[34vw]">
        <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(15px, 1.2vw, 18px)' }}>
          A friendly, practical course in Git & GitHub — built for beginners, taught like you're already on the team.
        </p>
      </div>

      {/* Meta strip — time + module count */}
      <div ref={metaRef} className="absolute left-[6vw] top-[48vh] md:top-[60vh]">
        <div className="flex items-center gap-3 text-white/40 text-xs font-accent uppercase tracking-[0.12em]">
          <span>~7 hrs</span>
          <span className="text-white/20">·</span>
          <span>8 modules</span>
          <span className="text-white/20">·</span>
          <span className="text-[#3CCF4A]">Free</span>
          {isLoggedIn && completedModules.length > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-[#F7B731]">{progressPct}% done</span>
            </>
          )}
        </div>
      </div>

      {/* Primary CTA */}
      <div ref={ctaRef} className="absolute left-[6vw] top-[54vh] md:top-[66vh]">
        <button
          onClick={handleStartLesson}
          className="bg-rose-punch text-white font-display font-semibold px-6 md:px-8 py-3 md:py-4 card-radius card-shadow
            hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300"
          style={{ fontSize: 'clamp(15px, 1.4vw, 20px)' }}>
          {isLoggedIn && completedModules.length > 0
            ? `Continue — Module ${completedModules.length + 1}`
            : isLoggedIn
              ? 'Start First Lesson'
              : 'Join Free & Start Learning'}
        </button>
      </div>

      {/* What you'll learn pills */}
      <div ref={pillsRef} className="absolute left-[6vw] top-[65vh] md:top-[76vh] w-[88vw] md:w-[38vw]">
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
      <div ref={ghostRef} className="absolute left-[6vw] top-[76vh] md:top-[86vh]">
        <button
          onClick={handleSeeInside}
          className="flex items-center gap-1.5 text-white/50 font-accent text-xs uppercase tracking-[0.14em] hover:text-white transition-colors">
          See what's inside <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cat */}
      <div ref={catRef} className="absolute hidden md:block" style={{ right: '6vw', top: '18vh', width: '38vw', maxWidth: '520px' }}>
        <img src="/hero_cat.png" alt="Gitter the cat mascot" className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }} />
      </div>
    </section>
  )
}

/**
 * ============================================================================
 * FooterSection.tsx
 * ============================================================================
 *
 * Final CTA section — "Start Your Streak" with dual call-to-action buttons,
 * the celebratory Gitter cat illustration, and footer links.
 *
 * CTA behaviour (intentionally distinct):
 * - Primary "Start Free" / "Continue Learning":
 *     Opens the curriculum panel at the user's next incomplete module,
 *     or prompts registration for guests. This is the conversion action.
 * - Secondary "Browse all 8 lessons":
 *     Opens the curriculum panel in its default browse state (no specific
 *     module focused). Lets the user survey the full course before deciding.
 *     Works whether or not the user is logged in.
 *
 * Footer links now route to real pages: /about, /privacy, /terms, /support.
 *
 * MOBILE: Cat illustration is hidden (too cramped), text and CTAs are
 * centered and full-width. Footer links stack vertically.
 * ============================================================================
 */

import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { GitBranch, Heart } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

const FOOTER_LINKS = [
  { to: '/about',   label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms',   label: 'Terms' },
  { to: '/support', label: 'Support' },
]

export default function FooterSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum, modules, completedModules } = useApp()
  const navigate = useNavigate()

  const sectionRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const ctasRef = useRef<HTMLDivElement>(null)
  const footerLinksRef = useRef<HTMLDivElement>(null)

  /**
   * Primary CTA — the conversion action.
   * Logged-in: opens curriculum at the next incomplete module so the user
   * lands exactly where they left off rather than at the beginning.
   * Guest: opens the register modal.
   */
  const handleStartFree = () => {
    if (isLoggedIn) {
      const nextModule = modules.find(m => !completedModules.includes(m.id))
      navigate('/learn')
      setTimeout(() => openCurriculum(nextModule?.id), 200)
    } else {
      openAuthModal('register')
    }
  }

  /**
   * Secondary CTA — browse the full curriculum.
   * Opens the panel without jumping to a specific module, letting the user
   * scroll through all 8 lessons at their own pace. No login required.
   */
  const handleBrowseAll = () => {
    navigate('/learn')
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.fromTo(leftRef.current,
        { y: '6vh', opacity: 0 },
        {
          y: 0, opacity: 1,
          scrollTrigger: {
            trigger: leftRef.current,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 0.5,
          }
        }
      )

      gsap.fromTo(catRef.current,
        { x: '10vw', scale: 0.98, opacity: 0 },
        {
          x: 0, scale: 1, opacity: 1,
          scrollTrigger: {
            trigger: catRef.current,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 0.5,
          }
        }
      )

      gsap.fromTo(ctasRef.current,
        { y: '10px', opacity: 0 },
        {
          y: 0, opacity: 1,
          scrollTrigger: {
            trigger: ctasRef.current,
            start: 'top 90%',
            end: 'top 70%',
            scrub: 0.5,
          }
        }
      )

      gsap.fromTo(footerLinksRef.current,
        { y: '10px', opacity: 0 },
        {
          y: 0, opacity: 1,
          scrollTrigger: {
            trigger: footerLinksRef.current,
            start: 'top 95%',
            end: 'top 80%',
            scrub: 0.5,
          }
        }
      )
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="footer"
      className={`${className} relative`}
      style={{ padding: '8vh 0 4vh', minHeight: '80vh' }}
    >
      {/* Left heading and CTAs */}
      <div className="px-[6vw] md:absolute md:left-[6vw] md:top-[10vh] md:w-[44vw]">
        <div ref={leftRef}>
          <h2 className="font-display font-bold heading-responsive tracking-[0.02em] mb-4 md:mb-6"
            style={{ fontSize: 'clamp(36px, 6vw, 72px)', color: '#2A2A2A' }}>
            Start Your<br />Streak
          </h2>
          <p className="leading-relaxed mb-6 md:mb-8 max-w-md" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)', color: '#2A2A2Acc' }}>
            Free to start. Fun to finish. Built for real teams. Join thousands of developers who learned Git the friendly way.
          </p>
        </div>

        <div ref={ctasRef} className="flex flex-col gap-3 md:gap-4">
          {/* Primary — conversion action */}
          <button
            onClick={handleStartFree}
            className="bg-rose-punch text-white font-display font-semibold px-6 md:px-8 py-3 md:py-4 card-radius card-shadow
              hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300 w-fit"
            style={{ fontSize: 'clamp(15px, 1.4vw, 20px)' }}>
            {isLoggedIn ? 'Continue Learning' : 'Start Free'}
          </button>

          {/* Secondary — low-commitment browse action */}
          <button
            onClick={handleBrowseAll}
            className="border-2 border-[#2A2A2A]/30 text-[#2A2A2A] font-display font-semibold px-6 md:px-8 py-3 md:py-4 card-radius
              hover:bg-[#2A2A2A]/5 hover:border-[#2A2A2A]/50 transition-all duration-300 w-fit"
            style={{ fontSize: 'clamp(13px, 1.2vw, 17px)' }}>
            Browse all 8 lessons
          </button>
        </div>
      </div>

      {/* Cat illustration — desktop only */}
      <div ref={catRef} className="hidden md:block absolute" style={{ right: '6vw', top: '10vh', width: '42vw', maxWidth: '560px' }}>
        <img
          src="/footer_cat.png"
          alt="Gitter celebrating"
          className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }}
        />
      </div>

      {/* Footer links */}
      <div ref={footerLinksRef} className="px-[6vw] mt-12 md:mt-0 md:absolute md:bottom-8 md:left-0 md:right-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid rgba(42,42,42,0.15)' }}>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {FOOTER_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className="font-accent text-xs uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
                style={{ color: '#2A2A2Acc' }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" style={{ color: '#2A2A2A80' }} />
            <span className="font-accent text-xs uppercase tracking-[0.14em]" style={{ color: '#2A2A2A80' }}>
              Made with
            </span>
            <Heart className="w-3 h-3 text-rose-punch fill-rose-punch" />
            <span className="font-accent text-xs uppercase tracking-[0.14em]" style={{ color: '#2A2A2A80' }}>
              by DevFlow Academy
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

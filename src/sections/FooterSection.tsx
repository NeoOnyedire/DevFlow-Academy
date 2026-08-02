/**
 * ============================================================================
 * FooterSection.tsx
 * ============================================================================
 *
 * Final CTA section — "Start Your Streak" with dual call-to-action buttons,
 * the celebratory Gitter cat illustration, and footer links.
 *
 * This section sits on a bg-sun-yellow canvas, which flips to a real dark
 * surface in Dark Mode (see index.css). Because of that, every text color
 * here reads from --text-on-accent / --text-on-accent-soft / --border-on-accent
 * instead of a hardcoded #2A2A2A, so it flips to light text automatically
 * when the canvas goes dark — no ternaries or theme-checking needed here.
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
 * OVERLAP FIX (v2): the text block and footer links used to each be their
 * own `position: absolute` element (top-[10vh] and bottom-24/bottom-8),
 * sized independently of one another. On shorter viewports — or once more
 * CTA copy/buttons got added — the two boxes simply overlapped, because
 * neither one knew how tall the other was. Pinning the links to a fixed
 * "bottom" offset can never fully fix that; it only moves where the
 * collision happens.
 *
 * Fixed properly by taking both blocks out of absolute positioning and
 * letting them sit in normal document flow, stacked top-to-bottom, so the
 * links block is pushed down by however tall the CTA block actually is —
 * they can no longer occupy the same space. The section's bottom padding
 * (`pb-28 md:pb-36`) guarantees the links land well clear of the fixed
 * Gitto (bottom-left) / Gitter (bottom-right) widgets regardless of
 * content height. Only the decorative cat illustration stays absolutely
 * positioned, since it's purely decorative and never needs to push layout.
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
      style={{ padding: '8vh 0 0' }}
    >
      {/* Content row: text/CTA column + cat column, side by side on desktop.
          Neither column is absolutely positioned, so the row's height is
          simply "however tall its tallest column is" — no manual vh guessing,
          no risk of the CTA block growing into anything below it. */}
      <div className="px-[6vw] grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-6 items-center">

        {/* Left: heading + copy + CTAs */}
        <div className="md:max-w-[44vw]">
          <div ref={leftRef}>
            <h2 className="font-display font-bold heading-responsive tracking-[0.02em] mb-4 md:mb-6"
              style={{ fontSize: 'clamp(36px, 6vw, 72px)', color: 'var(--text-on-accent)' }}>
              Start Your<br />Streak
            </h2>
            <p className="leading-relaxed mb-6 md:mb-8 max-w-md"
              style={{ fontSize: 'clamp(14px, 1.2vw, 18px)', color: 'var(--text-on-accent-soft)' }}>
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

            {/* Secondary — low-commitment browse action, theme-aware via .btn-outline-on-accent */}
            <button
              onClick={handleBrowseAll}
              className="btn-outline-on-accent font-display font-semibold px-6 md:px-8 py-3 md:py-4 card-radius w-fit"
              style={{ fontSize: 'clamp(13px, 1.2vw, 17px)' }}>
              Browse all 8 lessons
            </button>
          </div>
        </div>

        {/* Right: cat illustration — desktop only, purely decorative so it's
            fine for this column to just center it; no absolute positioning
            needed since it now lives in the same grid row as the text. */}
        <div ref={catRef} className="hidden md:flex justify-end">
          <img
            src="/footer_cat.png"
            alt="Gitter celebrating"
            className="w-full h-auto"
            style={{ maxWidth: '480px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))' }}
          />
        </div>
      </div>

      {/* Footer links — in normal flow below the content row, so it's
          physically impossible for it to overlap the CTAs above it no
          matter how tall that block gets. pb-28/md:pb-36 keeps it clear
          of the fixed Gitto (bottom-left) / Gitter (bottom-right) widgets. */}
      <div ref={footerLinksRef} className="px-[6vw] mt-12 md:mt-16 pb-28 md:pb-36">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid var(--border-on-accent)' }}>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {FOOTER_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className="font-accent text-xs uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-on-accent-soft)' }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" style={{ color: 'var(--text-on-accent-soft)' }} />
            <span className="font-accent text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-on-accent-soft)' }}>
              Made with
            </span>
            <Heart className="w-3 h-3 text-rose-punch fill-rose-punch" />
            <span className="font-accent text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-on-accent-soft)' }}>
              by DevFlow Academy
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

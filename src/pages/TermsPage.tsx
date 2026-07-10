/**
 * TermsPage.tsx  —  /terms
 *
 * General terms of use. Not a substitute for a lawyer-drafted agreement —
 * update this before relying on it in production.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import { FileText } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const SECTIONS = [
  {
    title: '1. Using DevFlow Academy',
    body: `DevFlow Academy is a free educational resource for learning Git and GitHub. By creating an account
    or using the site, you agree to use it for personal learning purposes and not to disrupt, scrape at
    scale, or attempt to abuse the site or its assistant, Gitter.`,
  },
  {
    title: '2. Accounts',
    body: `Account and progress data are stored locally in your browser. You're responsible for keeping your
    login details to yourself. We don't verify identities, so accounts should not be treated as a secure
    record of anything beyond your own course progress.`,
  },
  {
    title: '3. Course content and third-party videos',
    body: `Video lessons are curated from third-party YouTube channels and remain the property of their
    original creators. DevFlow Academy does not claim ownership of embedded videos and links each lesson back
    to its source channel.`,
  },
  {
    title: '4. No warranty',
    body: `The site, its curriculum, and Gitter's responses are provided "as is," without warranty of any
    kind. Git advice from Gitter is meant to be educational and helpful, not a substitute for your own
    judgment — always double-check commands before running them against real repositories, especially ones
    involving force-pushes, resets, or history rewrites.`,
  },
  {
    title: '5. Weekly challenges and leaderboards',
    body: `Points, streaks, and leaderboard positions are for motivation and fun. They don't represent any
    real-world certification, and challenge content rotates weekly.`,
  },
  {
    title: '6. Changes to these terms',
    body: `These terms may be updated as the site evolves. Continued use of the site after changes means you
    accept the updated terms.`,
  },
]

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 md:py-24 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-[#F7B731]" />
          <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">Terms</span>
        </div>

        <h1 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-4"
          style={{ fontSize: 'clamp(34px, 5.5vw, 60px)' }}>
          Terms of Use
        </h1>
        <p className="text-white/50 text-sm mb-10">Last updated 2026.</p>

        <div className="space-y-8">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="font-display font-bold text-white text-xl mb-2">{section.title}</h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <p className="text-white/35 text-xs leading-relaxed mt-14 pt-6 border-t border-white/10">
          This page is a general summary provided for transparency and isn't legal advice. If you need a
          formal terms of service for compliance purposes, consult a qualified professional.
        </p>
      </section>
    </PageWrapper>
  )
}

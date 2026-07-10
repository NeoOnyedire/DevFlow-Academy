/**
 * PrivacyPage.tsx  —  /privacy
 *
 * General, plain-language privacy overview. Not a substitute for a
 * lawyer-drafted policy — update this before relying on it in production,
 * especially if you add real backend storage, analytics, or payments.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import { ShieldCheck } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const SECTIONS = [
  {
    title: 'What we store, and where',
    body: `Your account (name, email) and your course progress — completed modules, review submission,
    scenario points, and connected GitHub username — are stored in your browser's local storage. This data
    stays on your device and is not sent to a DevFlow Academy database or shared with third parties.`,
  },
  {
    title: 'What leaves your browser',
    body: `Two things call out to third-party services: connecting your GitHub username fetches your public
    profile info directly from the GitHub API, and messages you send to Gitter (the in-app assistant) are
    relayed through our own server to Anthropic's Claude API so Gitter can reply. We don't use your chat
    messages for anything beyond generating that reply.`,
  },
  {
    title: 'Cookies and tracking',
    body: `This site does not run third-party advertising or analytics trackers. It does not sell or share
    your data with advertisers.`,
  },
  {
    title: 'Your control over your data',
    body: `Because your account and progress live in your browser's local storage, clearing your browser
    data or using a different device/browser will reset your progress. Logging out clears your session but
    keeps your account so you can log back in on the same browser.`,
  },
  {
    title: 'Changes to this policy',
    body: `If how this site handles data changes — for example, if progress moves to a real backend — this
    page will be updated to reflect that.`,
  },
]

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 md:py-24 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-5 h-5 text-[#F7B731]" />
          <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">Privacy</span>
        </div>

        <h1 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-4"
          style={{ fontSize: 'clamp(34px, 5.5vw, 60px)' }}>
          Privacy Policy
        </h1>
        <p className="text-white/50 text-sm mb-10">Plain-language overview — last updated 2026.</p>

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
          formal privacy policy for compliance purposes, consult a qualified professional.
        </p>
      </section>
    </PageWrapper>
  )
}

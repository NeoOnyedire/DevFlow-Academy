/**
 * PrivacyPage.tsx  —  /privacy
 *
 * General, plain-language privacy overview. Not a substitute for a
 * lawyer-drafted policy — update this before relying on it in production,
 * especially if you add more backend storage, analytics, or payments.
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
    body: `Your account (name, email), your course progress — completed modules, scenario points, and
    connected GitHub username — are stored in your browser's local storage. This data stays on your device
    and is not sent to a DevFlow Academy database or shared with third parties.`,
  },
  {
    title: 'Reviews are genuinely public, and AI-checked before publishing',
    body: `Course reviews you submit are sent to and stored on our server (a small shared database), and are
    shown to every visitor on the homepage — that's the point of leaving one. A review includes your star
    rating, your written comment, the display name on your account, and the submission date.
    Before a review is published, it's checked by Gitter AI using your own API key (see below) to screen out
    spam, links to unrelated sites, and off-topic or inappropriate content — genuine, on-topic feedback,
    including critical feedback, is always approved. Activating Gitter AI is required to complete your first
    module and to submit a review, so that every published review has gone through this check.`,
  },
  {
    title: 'What leaves your browser',
    body: `By default, Gitter (the in-app assistant) runs in "Lite" mode — it answers from a small built-in
    Git knowledge base, and nothing is sent anywhere. Activating "Gitter AI" requires providing your own API
    key from Google Gemini, Groq, or Anthropic. Once activated, your chat messages and that key are sent from
    your browser through our own proxy server directly to whichever provider you picked, so Gitter can reply —
    and that same key is used, with the rating and comment you write, to run the review check described above
    before a review is submitted. We don't store that key on our servers, and we don't use your chat messages
    or review text for anything beyond generating that reply or check. Separately, connecting your GitHub
    username fetches your public profile info directly from the GitHub API.`,
  },
  {
    title: 'Who pays for what',
    body: `DevFlow Academy never holds or pays for any AI API key. Gitter Lite costs nothing to use, for
    anyone. Gitter AI is entirely optional in day-to-day chat, but activating it (with a key from Gemini,
    Groq, or Anthropic) is required to complete your first module and to submit a review, since that's what
    powers the review check described above. Gemini and Groq both offer free tiers with no card required.
    Anthropic's API is not free forever — new accounts get a small trial credit, and ongoing use requires a
    payment method on your own Anthropic account after that. Any usage under any provider is governed by that
    provider's own terms and limits, not by us. There is no "log in with your existing ChatGPT or Claude
    subscription" option, because AI providers don't offer a way for third-party sites to use someone's
    existing consumer chat subscription — API access is always a separate account and, for Anthropic, a
    separate paid arrangement.`,
  },
  {
    title: 'Cookies and tracking',
    body: `This site does not run third-party advertising or analytics trackers. It does not sell or share
    your data with advertisers.`,
  },
  {
    title: 'Your control over your data',
    body: `Because your account, progress, and any Gitter AI key live in your browser's local storage,
    clearing your browser data or using a different device/browser will reset your progress and disconnect
    Gitter AI mode (you'll drop back to Gitter Lite automatically, and will need to reactivate it before
    submitting a new review). It will not remove any review you've already submitted, since that lives on our
    server, not your browser — contact us via the Support page if you'd like a review taken down. Logging out
    clears your session but keeps your account so you can log back in on the same browser.`,
  },
  {
    title: 'Changes to this policy',
    body: `If how this site handles data changes — for example, if progress also moves to a real backend —
    this page will be updated to reflect that.`,
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

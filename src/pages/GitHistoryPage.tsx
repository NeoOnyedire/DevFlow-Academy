/**
 * GitHistoryPage.tsx  —  /git-history
 *
 * The "nerdy stuff" page linked from About — a changelog of the actual
 * engineering decisions behind DevFlow Academy itself, not the curriculum.
 * Written like a git log: newest first, one-line summary + a short "why".
 */

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import { GitCommit, GitBranch } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Entry {
  hash: string
  title: string
  body: string
}

const ENTRIES: Entry[] = [
  {
    hash: 'f3a91c2',
    title: 'Gitto joins Gitter',
    body: "A second helper, scoped to account and settings admin instead of Git itself. Kept deliberately simple — fixed keyword answers, no AI key required — since these are FAQ-shaped questions, not open conversation.",
  },
  {
    hash: 'b7e0d4a',
    title: 'Three-way theme system',
    body: "Original, Light, and Dark, toggled via a single data-theme attribute on <html> that swaps a handful of CSS custom properties. The tricky part wasn't the toggle — it was the full-page yellow sections that had text colors hardcoded instead of variable-driven, which needed patching so Dark Mode actually looked different.",
  },
  {
    hash: 'a1c58e9',
    title: 'Auth squeezed into one dynamic route',
    body: "Vercel's Hobby plan caps a deployment at 12 Serverless Functions. Nine separate auth endpoints (login, register, GitHub, password reset, and so on) plus gitter, leaderboard, progress, and reviews added up to 13 — one over. Consolidating auth into a single /api/auth/[action] dispatcher dropped the count to 5.",
  },
  {
    hash: '9d2f671',
    title: 'Sessions became real, signed cookies',
    body: "A lightweight hand-rolled equivalent of a JWT using only Node's built-in crypto module — no extra dependency. The cookie holds a user id and expiry, HMAC-signed with a server-only secret, so it can't be forged or edited client-side.",
  },
  {
    hash: '84bc003',
    title: 'Two databases, one job each',
    body: "Users, sessions, reviews, and tokens live in Upstash Redis — simple key-value lookups. The leaderboard needed a real GROUP BY + RANK() window function to rank summed points per user per week, which Redis's flat model can't express, so that one table lives in Postgres instead.",
  },
  {
    hash: '77a12ef',
    title: 'Three AI providers, one shared caller',
    body: "Gemini, Groq, and Anthropic all get called through the same api/_lib/aiProviders.ts module, reused by both the chat endpoint and the review-moderation endpoint. Every request carries the learner's own API key — DevFlow Academy never holds or spends one on their behalf.",
  },
  {
    hash: '5f9d8b1',
    title: 'Reviews get a second opinion before publishing',
    body: "Every submitted review is checked by an AI call (using the reviewer's own key) for spam, unrelated links, or off-topic content before it's written to the shared review list. If the AI provider hiccups, moderation fails open rather than blocking a genuine reviewer over a formatting error.",
  },
  {
    hash: '3c04a76',
    title: 'Progress moved out of localStorage',
    body: "Completed modules now live in a Postgres user_progress table for logged-in accounts, syncing across devices and surviving a cleared browser. Guests still fall back to localStorage, since there's no account to attach server-side progress to.",
  },
  {
    hash: '2e88f10',
    title: "GitHub OAuth's CSRF handshake",
    body: "Before redirecting to GitHub, a random state value is stashed in sessionStorage. When GitHub redirects back, that value has to match exactly once — a captured callback URL can't be replayed.",
  },
  {
    hash: '1a5c9d4',
    title: 'Error boundaries got a divorce',
    body: "The always-mounted overlay group (auth modal, curriculum panel, Gitter, Gitto) and the routed page content each sit inside their own <ErrorBoundary>, with different fallback UIs. A crash in one no longer takes the other down with it.",
  },
]

export default function GitHistoryPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 md:py-24 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-5 h-5 text-[#F7B731]" />
          <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">Git History</span>
        </div>

        <h1 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-4"
          style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          The nerdy stuff
        </h1>
        <p className="text-white/70 leading-relaxed mb-14 max-w-2xl" style={{ fontSize: 'clamp(15px, 1.15vw, 19px)' }}>
          Not the curriculum — this is a changelog of how DevFlow Academy itself is actually built: the
          databases, the auth, the AI plumbing. Newest decisions first, like a real git log.
        </p>

        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/10" aria-hidden="true" />
          <div className="space-y-8">
            {ENTRIES.map(entry => (
              <div key={entry.hash} className="relative pl-10">
                <div className="absolute left-0 top-0.5 w-8 h-8 rounded-full bg-[#4A2F2F] card-outline flex items-center justify-center">
                  <GitCommit className="w-3.5 h-3.5 text-[#F7B731]" />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[11px] text-[#F7B731]/70">{entry.hash}</span>
                  <h2 className="font-display font-bold text-white text-lg">{entry.title}</h2>
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{entry.body}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/35 text-xs leading-relaxed mt-14 pt-6 border-t border-white/10">
          Curious about a specific decision? The Support page has links to the actual repository.
        </p>
      </section>
    </PageWrapper>
  )
}
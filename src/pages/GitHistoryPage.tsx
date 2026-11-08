/**
 * GitHistoryPage.tsx — /git-history
 *
 * A curated set of real repository commits with their verified Git metadata
 * and a separate editorial note explaining the engineering context.
 */

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import { GIT_HISTORY } from '../content/gitHistory'
import { GitCommit, GitBranch, ExternalLink } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const REPOSITORY_URL = 'https://github.com/NeoOnyedire/DevFlow-Academy'

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
        <p className="text-white/70 leading-relaxed mb-5 max-w-2xl" style={{ fontSize: 'clamp(15px, 1.15vw, 19px)' }}>
          A selection of real engineering commits from DevFlow Academy, newest first. Commit hashes, subjects,
          authors, and dates come from this repository; the notes are editorial context, not part of the commit.
        </p>
        <a
          href={`${REPOSITORY_URL}/commits/main`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[#F7B731] hover:underline mb-14"
        >
          Browse the complete GitHub history <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/10" aria-hidden="true" />
          <div className="space-y-8">
            {GIT_HISTORY.map(entry => (
              <article key={entry.commit} className="relative pl-10">
                <div className="absolute left-0 top-0.5 w-8 h-8 rounded-full bg-[#4A2F2F] card-outline flex items-center justify-center">
                  <GitCommit className="w-3.5 h-3.5 text-[#F7B731]" />
                </div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
                  <a
                    href={`${REPOSITORY_URL}/commit/${entry.commit}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-[#F7B731]/80 hover:underline"
                    title={entry.commit}
                  >
                    {entry.commit.slice(0, 7)}
                  </a>
                  <time dateTime={entry.date} className="font-mono text-[11px] text-white/40">
                    {entry.date}
                  </time>
                  <span className="font-mono text-[11px] text-white/40">by {entry.author}</span>
                </div>
                <h2 className="font-display font-bold text-white text-lg break-words">{entry.subject.trim()}</h2>
                <p className="text-white/65 text-sm leading-relaxed mt-2">{entry.note}</p>
              </article>
            ))}
          </div>
        </div>

        <p className="text-white/35 text-xs leading-relaxed mt-14 pt-6 border-t border-white/10">
          These are selected milestones rather than every commit. Each hash links to its commit on GitHub, and CI
          checks that the displayed metadata still matches the repository.
        </p>
      </section>
    </PageWrapper>
  )
}

/**
 * ============================================================================
 * TroubleshootSection.tsx
 * ============================================================================
 *
 * "Find Your Fix Fast" — a bold error-lookup section with a playful
 * emoji cipher riddle. Features a photo card and search CTA.
 *
 * The emoji riddle (🐙🐈🟰🙅☂️🐟) is a fun Easter egg that reads
 * as "OctoCat ≠ No Umbrella Fish" — pure nonsense that invites curiosity.
 *
 * MOBILE: Stacks vertically with image on top, text below.
 * Pinned scroll with 3-phase animation on desktop; simpler on mobile.
 *
 * Clicking "Open Troubleshooter" opens the curriculum panel.
 * ============================================================================
 */

import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { ExternalLink, Search, Zap } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

interface GitError {
  title: string
  symptoms: string[]
  explanation: string
  fix: string
  command: string
  videoTitle: string
  videoUrl: string
  moduleId: string
}

/** The emoji riddle tokens */
const EMOJIS = ['🐙', '🐈', '🟰', '🙅', '☂️', '🐟']

const GIT_ERRORS: GitError[] = [
  {
    title: 'Merge conflict',
    symptoms: ['conflict', 'merge failed', 'both modified', 'fix conflicts', 'cannot merge'],
    explanation: 'Git found two edits to the same part of a file and needs you to choose the final version.',
    fix: 'Open each conflicted file, keep the correct lines, remove conflict markers, then stage and commit the resolution.',
    command: 'git status && git add <file> && git commit',
    videoTitle: 'Git Branching and Merging Explained',
    videoUrl: 'https://www.youtube.com/watch?v=hNdrIIgK1rk',
    moduleId: 'mod-07',
  },
  {
    title: 'Detached HEAD',
    symptoms: ['detached head', 'not currently on a branch', 'checkout commit', 'head detached'],
    explanation: 'You checked out a specific commit instead of a branch, so new commits will not belong to a named branch yet.',
    fix: 'Create a branch from the current commit if you want to keep working, or switch back to an existing branch.',
    command: 'git switch -c save-my-work',
    videoTitle: 'Git Advanced - Professional Tips',
    videoUrl: 'https://www.youtube.com/watch?v=l2yrJtwoC_E',
    moduleId: 'mod-06',
  },
  {
    title: 'Rejected non-fast-forward push',
    symptoms: ['non-fast-forward', 'rejected', 'fetch first', 'failed to push', 'updates were rejected'],
    explanation: 'The remote branch has commits you do not have locally, so Git will not overwrite them with your push.',
    fix: 'Pull or fetch the remote changes, resolve anything that conflicts, then push again.',
    command: 'git pull --rebase origin main',
    videoTitle: 'Git and GitHub for Beginners',
    videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    moduleId: 'mod-02',
  },
  {
    title: 'Untracked files would be overwritten',
    symptoms: ['untracked files', 'would be overwritten', 'checkout failed', 'pull failed'],
    explanation: 'A file exists locally but is not tracked by Git, and the branch you are moving to has a tracked file at the same path.',
    fix: 'Move, delete, or commit the local file before switching branches or pulling.',
    command: 'git status --short',
    videoTitle: 'Git & GitHub Crash Course 2026',
    videoUrl: 'https://www.youtube.com/watch?v=mAFoROnOfHs',
    moduleId: 'mod-01',
  },
  {
    title: 'Accidentally committed to main',
    symptoms: ['committed to main', 'wrong branch', 'undo commit', 'move commit', 'accidental commit'],
    explanation: 'Your commit is valid, but it landed on the wrong branch and needs to be moved into a safer review branch.',
    fix: 'Create a branch at the current commit, then reset main back to the remote branch once your work is safe.',
    command: 'git switch -c feature/fix && git switch main',
    videoTitle: 'Complete Git and GitHub Tutorial',
    videoUrl: 'https://www.youtube.com/watch?v=apGV9Kg7ics',
    moduleId: 'mod-05',
  },
  {
    title: 'Local changes block pull or checkout',
    symptoms: ['local changes', 'would be overwritten by merge', 'stash', 'checkout blocked', 'pull blocked'],
    explanation: 'Git is protecting edits in your working tree before it applies incoming branch changes.',
    fix: 'Commit the edits if they are ready, or stash them temporarily and re-apply them after the pull or switch.',
    command: 'git stash push -m "work in progress"',
    videoTitle: 'Git Advanced - Professional Tips',
    videoUrl: 'https://www.youtube.com/watch?v=l2yrJtwoC_E',
    moduleId: 'mod-06',
  },
]

function scoreError(error: GitError, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return 0

  const searchable = [
    error.title,
    error.explanation,
    error.fix,
    error.command,
    ...error.symptoms,
  ].join(' ').toLowerCase()

  const words = normalizedQuery.split(/\s+/).filter(Boolean)
  const wordScore = words.reduce((score, word) => {
    if (searchable.includes(word)) return score + word.length * 3

    let cursor = 0
    for (const char of word) {
      cursor = searchable.indexOf(char, cursor)
      if (cursor === -1) return score
      cursor += 1
    }
    return score + Math.max(1, Math.floor(word.length / 2))
  }, 0)

  return searchable.includes(normalizedQuery) ? wordScore + 24 : wordScore
}

export default function TroubleshootSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()
  const [query, setQuery] = useState('')

  const sectionRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const emojiTokensRef = useRef<(HTMLSpanElement | null)[]>([])

  const results = useMemo(() => {
    const ranked = GIT_ERRORS.map(error => ({
      error,
      score: scoreError(error, query),
    }))
      .filter(item => query.trim() === '' || item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.error)

    return ranked.slice(0, query.trim() ? 3 : 2)
  }, [query])

  /** Open curriculum panel or auth modal */
  const handleOpenTroubleshooter = () => {
    if (isLoggedIn) {
      openCurriculum('mod-01')
    } else {
      openAuthModal('register')
    }
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          toggleActions: 'play none none reverse',
          once: false,
        }
      })

      // ---- ENTRANCE (0% - 30%) ----
      scrollTl
        // Photo card slides in from left
        .fromTo(photoRef.current,
          { x: '-55vw', rotate: -8, scale: 0.92, opacity: 0 },
          { x: 0, rotate: 0, scale: 1, opacity: 1, ease: 'power1.out' },
          0.06
        )
        // Heading slides in from right
        .fromTo(headingRef.current,
          { x: '45vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'power1.out' },
          0.08
        )
        // Subheading fades up
        .fromTo(subRef.current,
          { y: '14vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'power1.out' },
          0.14
        )

      // Emoji tokens appear one by one with stagger
      emojiTokensRef.current.forEach((token, i) => {
        if (!token) return
        scrollTl.fromTo(token,
          { y: '14vh', scale: 0.7, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, ease: 'none' },
          0.18 + i * 0.02
        )
      })

      // CTA fades in
      scrollTl.fromTo(ctaRef.current,
        { y: '18vh', scale: 0.96, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0.20
      )

      // ---- SETTLE (30% - 70%) — static ----

      // No exit animation — preserve the section content once it's in view.

    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="troubleshoot"
      className={`${className} flex justify-center`}
      style={{ paddingTop: '10vh', paddingBottom: '10vh' }}
    >
      <div className="relative w-full max-w-[1360px] px-6 md:px-10 mx-auto flex flex-col md:flex-row items-center gap-10">
        {/* Photo card — left side (hidden on mobile, smaller on tablet) */}
        <div
          ref={photoRef}
          className="hidden md:block card-radius card-shadow overflow-hidden card-outline shrink-0"
          style={{ width: '36vw', maxWidth: '520px', minWidth: '340px', height: '60vh' }}
        >
          <img
            src="/troubleshoot_photo.jpg"
            alt="Developer troubleshooting"
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(0.85) contrast(1.05)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#F7B731]" />
              <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/70">This Week's Challenge</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[52vw] max-w-[640px]">
          {/* Heading */}
          <div ref={headingRef} className="max-w-full">
            <h2 className="font-display font-bold text-white heading-responsive tracking-[0.02em]"
              style={{ fontSize: 'clamp(34px, 5vw, 84px)' }}>
              Find Your Fix<br />Fast
            </h2>
          </div>

          {/* Subheading */}
          <div ref={subRef} className="mt-6 max-w-full">
            <p className="text-white/80 leading-relaxed" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
              Search symptoms. Get answers. Real workplace errors, explained like a teammate would. Free video solutions from expert educators.
            </p>
          </div>

          {/* Working Git error search */}
          <div className="mt-8">
            <label htmlFor="git-error-search" className="sr-only">
              Search common Git errors
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
              <input
                id="git-error-search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Try merge conflict, rejected push, detached HEAD..."
                className="w-full rounded-lg border border-white/15 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/45 outline-none transition-colors focus:border-[#F7B731]/60 focus:bg-white/15"
              />
            </div>

            <div className="mt-4 grid gap-3">
              {results.length > 0 ? (
                results.map(result => (
                  <article key={result.title} className="rounded-lg border border-white/12 bg-white/[0.08] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-white">{result.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/70">{result.explanation}</p>
                      </div>
                      <button
                        onClick={() => isLoggedIn ? openCurriculum(result.moduleId) : openAuthModal('register')}
                        className="rounded-lg bg-[#F7B731] px-3 py-2 text-xs font-accent uppercase tracking-[0.12em] text-[#2A2A2A] transition-transform hover:scale-105"
                      >
                        Lesson
                      </button>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-white/78">{result.fix}</p>
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-[#F7B731]">
                      {result.command}
                    </div>
                    <a
                      href={result.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-white"
                    >
                      {result.videoTitle}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-white/12 bg-white/[0.08] p-4 text-sm text-white/70">
                  No exact match yet. Try words from the terminal output, like "rejected", "stash", or "conflict".
                </div>
              )}
            </div>
          </div>

          {/* Emoji riddle */}
          <div ref={emojiRef} className="mt-10">
            <div className="bg-white/10 backdrop-blur-sm card-radius px-4 md:px-6 py-3 md:py-4 card-outline inline-flex items-center gap-2 md:gap-3 flex-wrap justify-center md:justify-start">
              {EMOJIS.map((emoji, i) => (
                <span
                  key={i}
                  ref={el => { emojiTokensRef.current[i] = el }}
                  className="text-2xl md:text-3xl"
                  style={{ display: 'inline-block' }}
                >
                  {emoji}
                </span>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-3 font-accent uppercase tracking-wider">
              Can you decode the fix?
            </p>
          </div>

          {/* CTA button */}
          <div ref={ctaRef} className="mt-8">
            <button
              onClick={handleOpenTroubleshooter}
              className="bg-rose-punch text-white font-display font-semibold px-5 md:px-7 py-3 md:py-3.5 card-radius card-shadow
                flex items-center gap-3 hover:scale-105 hover:shadow-[0_25px_55px_rgba(255,77,109,0.35)] transition-all duration-300"
              style={{ fontSize: 'clamp(13px, 1.2vw, 17px)' }}>
              <Search className="w-4 h-4 md:w-5 md:h-5" />
              {isLoggedIn ? 'Open Troubleshooter' : 'Join Free to Access'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

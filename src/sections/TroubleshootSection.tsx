/**
 * TroubleshootSection.tsx — "Find Your Fix Fast"
 *
 * Layout rewrite: two-column CSS grid.
 * Left: photo card (desktop) / hidden (mobile).
 * Right: heading, search, results, riddle, optional CTA.
 * Both columns are in normal flow — no position:absolute on content.
 */

import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { ExternalLink, Search, CheckCircle2 } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props { className?: string }

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

const EMOJIS = ['🐙', '🐈', '🟰', '🙅', '☂️', '🐟']
const RIDDLE_ANSWERS = ['octocat', 'octo cat', 'no fish', 'no umbrella fish', 'cat no fish']

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
    explanation: 'You checked out a specific commit instead of a branch, so new commits won\'t belong to a named branch yet.',
    fix: 'Create a branch from the current commit if you want to keep working, or switch back to an existing branch.',
    command: 'git switch -c save-my-work',
    videoTitle: 'Git Advanced - Professional Tips',
    videoUrl: 'https://www.youtube.com/watch?v=l2yrJtwoC_E',
    moduleId: 'mod-06',
  },
  {
    title: 'Rejected non-fast-forward push',
    symptoms: ['non-fast-forward', 'rejected', 'fetch first', 'failed to push', 'updates were rejected'],
    explanation: 'The remote branch has commits you don\'t have locally, so Git won\'t overwrite them with your push.',
    fix: 'Pull or fetch the remote changes, resolve anything that conflicts, then push again.',
    command: 'git pull --rebase origin main',
    videoTitle: 'Git and GitHub for Beginners',
    videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    moduleId: 'mod-02',
  },
  {
    title: 'Untracked files would be overwritten',
    symptoms: ['untracked files', 'would be overwritten', 'checkout failed', 'pull failed'],
    explanation: 'A file exists locally but isn\'t tracked by Git, and the branch you\'re moving to has a tracked file at the same path.',
    fix: 'Move, delete, or commit the local file before switching branches or pulling.',
    command: 'git status --short',
    videoTitle: 'Git & GitHub Crash Course 2026',
    videoUrl: 'https://www.youtube.com/watch?v=mAFoROnOfHs',
    moduleId: 'mod-01',
  },
  {
    title: 'Accidentally committed to main',
    symptoms: ['committed to main', 'wrong branch', 'undo commit', 'move commit', 'accidental commit'],
    explanation: 'Your commit is valid, but it landed on the wrong branch and needs to move into a review branch.',
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
    fix: 'Commit the edits if ready, or stash them temporarily and re-apply after the pull or switch.',
    command: 'git stash push -m "work in progress"',
    videoTitle: 'Git Advanced - Professional Tips',
    videoUrl: 'https://www.youtube.com/watch?v=l2yrJtwoC_E',
    moduleId: 'mod-06',
  },
]

function scoreError(error: GitError, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const searchable = [error.title, error.explanation, error.fix, error.command, ...error.symptoms].join(' ').toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
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
  return searchable.includes(q) ? wordScore + 24 : wordScore
}

export default function TroubleshootSection({ className = '' }: Props) {
  const { isLoggedIn, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()
  const [query, setQuery]             = useState('')
  const [riddleInput, setRiddleInput] = useState('')
  const [riddleSolved, setRiddleSolved] = useState(false)

  const sectionRef = useRef<HTMLDivElement>(null)
  const photoRef   = useRef<HTMLDivElement>(null)
  const rightRef   = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const ranked = GIT_ERRORS
      .map(e => ({ error: e, score: scoreError(e, query) }))
      .filter(item => query.trim() === '' || item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.error)
    return ranked.slice(0, query.trim() ? 3 : 2)
  }, [query])

  const handleRiddleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const answer = riddleInput.trim().toLowerCase()
    if (RIDDLE_ANSWERS.some(a => answer.includes(a.split(' ')[0]) || answer === a)) {
      setRiddleSolved(true)
    } else {
      setRiddleInput('')
    }
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      gsap.fromTo(photoRef.current,
        { x: '-8vw', opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 40%', scrub: 0.5 }
        }
      )
      gsap.fromTo(rightRef.current,
        { x: '8vw', opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 40%', scrub: 0.5 }
        }
      )
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="troubleshoot"
      className={`${className} relative overflow-hidden`}
      style={{ minHeight: '100vh' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen gap-8 md:gap-12 px-[6vw] py-16 md:py-20 items-center">

        {/* Left: photo card — desktop only */}
        <div ref={photoRef} className="hidden md:block">
          <div className="card-radius card-shadow overflow-hidden card-outline w-full"
            style={{ height: '65vh', maxHeight: '600px' }}>
            <img src="/troubleshoot_photo.jpg" alt="Developer troubleshooting"
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.85) contrast(1.05)' }} />
          </div>
        </div>

        {/* Right: heading + search + results */}
        <div ref={rightRef} className="flex flex-col justify-center">
          <h2 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-4"
            style={{ fontSize: 'clamp(34px, 4.5vw, 72px)' }}>
            Find Your Fix<br />Fast
          </h2>
          <p className="text-white/75 leading-relaxed mb-8 max-w-md"
            style={{ fontSize: 'clamp(14px, 1.1vw, 17px)' }}>
            Search symptoms. Get answers. Real workplace errors, explained like a teammate would.
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              id="git-error-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Try merge conflict, rejected push, detached HEAD…"
              className="w-full rounded-xl border border-white/15 bg-white/10 py-3.5 pl-12 pr-4
                text-sm text-white placeholder-white/40 outline-none transition-colors
                focus:border-[#F7B731]/60 focus:bg-white/15"
            />
          </div>

          {/* Results */}
          <div className="space-y-3 mb-8">
            {results.length > 0 ? results.map(result => (
              <article key={result.title} className="rounded-xl border border-white/12 bg-white/[0.07] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-lg font-semibold text-white">{result.title}</h3>
                  <button
                    onClick={() => isLoggedIn ? openCurriculum(result.moduleId) : openAuthModal('register')}
                    className="flex-shrink-0 rounded-lg bg-[#F7B731] px-3 py-1.5 text-[10px] font-accent uppercase tracking-wider text-[#2A2A2A] hover:scale-105 transition-transform">
                    Lesson
                  </button>
                </div>
                <p className="text-sm text-white/65 mb-2">{result.explanation}</p>
                <p className="text-sm text-white/78 mb-3">{result.fix}</p>
                <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-[#F7B731] mb-3">
                  {result.command}
                </div>
                <a href={result.videoUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 hover:text-white transition-colors">
                  {result.videoTitle} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </article>
            )) : (
              <div className="rounded-xl border border-white/12 bg-white/[0.07] p-4 text-sm text-white/55">
                No exact match yet. Try words from the terminal output — "rejected", "stash", or "conflict".
              </div>
            )}
          </div>

          {/* Emoji riddle */}
          <div className="bg-white/10 rounded-xl px-4 py-4 border border-white/10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {EMOJIS.map((emoji, i) => (
                <span key={i} className="text-2xl">{emoji}</span>
              ))}
            </div>
            <p className="text-white/45 text-xs font-accent uppercase tracking-wider mb-3">
              Can you decode the fix?
            </p>
            {riddleSolved ? (
              <div className="flex items-center gap-2 text-[#3CCF4A] text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                You got it! OctoCat ≠ no fish — don't push to main. 🐱
              </div>
            ) : (
              <form onSubmit={handleRiddleSubmit} className="flex gap-2">
                <input value={riddleInput} onChange={e => setRiddleInput(e.target.value)}
                  placeholder="Type your answer…"
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2
                    text-sm text-white placeholder-white/35 outline-none focus:border-[#F7B731]/60" />
                <button type="submit"
                  className="rounded-lg bg-white/15 px-4 py-2 text-sm font-display font-semibold text-white hover:bg-white/22 transition-colors">
                  Guess
                </button>
              </form>
            )}
          </div>

          {/* Guest CTA */}
          {!isLoggedIn && (
            <div className="mt-6">
              <button onClick={() => openAuthModal('register')}
                className="bg-rose-punch text-white font-display font-semibold px-6 py-3 card-radius card-shadow
                  flex items-center gap-3 hover:scale-105 transition-all duration-300"
                style={{ fontSize: 'clamp(13px, 1.1vw, 16px)' }}>
                <Search className="w-4 h-4" />
                Join Free to Search Errors
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

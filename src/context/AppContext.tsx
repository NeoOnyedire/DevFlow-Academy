/* eslint-disable react-refresh/only-export-components */
/**
 * ============================================================================
 * AppContext.tsx
 * ============================================================================
 *
 * Application-level state management for DevFlow Academy.
 * Handles UI modals, curriculum panel, video progress, and review state.
 *
 * Features:
 * - Curriculum panel open/close
 * - Active module/video tracking
 * - Video watch progress per user
 * - Review submission (required before course completion) — reviews are
 *   fetched from and posted to /api/reviews, a real shared backend, so
 *   they're visible to every visitor, not just the browser that wrote
 *   them. `hasSubmittedReview` itself stays a local, per-browser flag —
 *   it just gates this browser's own "have I already reviewed?" UI, the
 *   same way course progress does.
 * - Completed modules tracking — synced to Postgres via /api/progress
 *   for logged-in users (see db/schema.sql's user_progress table), so
 *   progress survives a cleared browser or a different device. Guests
 *   (no account) fall back to a local, per-browser localStorage key,
 *   since there's no account to attach server-side progress to.
 * - Repo Royale leaderboard — real, shared data from a Postgres-backed
 *   /api/leaderboard endpoint. Points are recorded server-side against
 *   the signed-in account when a weekly challenge is completed; the
 *   "have I completed this challenge" flag itself stays local (same
 *   pattern as hasSubmittedReview) since it's purely a per-browser UI
 *   gate, not something that needs to be globally true.
 * ============================================================================
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type LearningRole = 'junior-dev' | 'devops' | 'career-switcher'

export interface RolePath {
  id: LearningRole
  label: string
  focus: string
  recommendedModules: string[]
  helperTone: string
}

export interface GitHubProfile {
  username: string
  avatarUrl: string
  profileUrl: string
  publicRepos: number
  followers: number
}

export interface WeeklyChallenge {
  id: string
  title: string
  brief: string
  rolePrompt: string
  command: string
  reward: number
  moduleId: string
}

/** A public review, as returned by the shared /api/reviews backend. */
export interface PublicReview {
  rating: number
  comment: string
  date: string
  userName: string
}

/** One ranked row, as returned by GET /api/leaderboard (Postgres-backed). */
export interface LeaderboardEntry {
  user_name: string
  total_points: number
  rank: number
}

/** A single curriculum module containing a YouTube video */
export interface CurriculumModule {
  id: string
  num: string
  title: string
  description: string
  youtubeId: string
  channel: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  tags: string[]
}

/** App context value shape */
interface AppContextValue {
  // Role path
  role: LearningRole
  rolePath: RolePath
  setRole: (role: LearningRole) => void

  // Curriculum panel
  isCurriculumOpen: boolean
  activeModuleId: string | null
  openCurriculum: (moduleId?: string) => void
  closeCurriculum: () => void
  setActiveModule: (id: string) => void

  // Review
  isReviewModalOpen: boolean
  hasSubmittedReview: boolean
  openReviewModal: () => void
  closeReviewModal: () => void
  submitReview: (rating: number, comment: string) => Promise<{ ok: boolean; message: string }>

  // Public reviews — shared across all visitors, backed by /api/reviews
  reviews: PublicReview[]
  isLoadingReviews: boolean
  reviewsError: string | null
  refreshReviews: () => Promise<void>

  // Progress — server-synced for logged-in users via /api/progress,
  // localStorage fallback for guests
  completedModules: string[]
  toggleModuleComplete: (id: string) => void
  isCourseComplete: boolean
  isLoadingProgress: boolean

  // GitHub integration
  githubProfile: GitHubProfile | null
  connectGitHub: (username: string) => Promise<{ ok: boolean; message: string }>
  disconnectGitHub: () => void

  // Weekly challenge
  weeklyChallenge: WeeklyChallenge
  hasCompletedWeeklyChallenge: boolean
  completeWeeklyChallenge: () => Promise<void>

  // Leaderboard — real data, shared across everyone, via /api/leaderboard
  leaderboard: LeaderboardEntry[]
  isLoadingLeaderboard: boolean
  refreshLeaderboard: () => Promise<void>

  // Curriculum data
  modules: CurriculumModule[]
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export const ROLE_PATHS: RolePath[] = [
  {
    id: 'junior-dev',
    label: 'Junior Dev',
    focus: 'Commits, branches, pull requests, and confident team habits.',
    recommendedModules: ['mod-01', 'mod-02', 'mod-03', 'mod-04', 'mod-07', 'mod-05', 'mod-06', 'mod-08'],
    helperTone: 'I will keep this practical and beginner-friendly.',
  },
  {
    id: 'devops',
    label: 'DevOps',
    focus: 'Clean history, rollback thinking, automation, and CI/CD workflows.',
    recommendedModules: ['mod-08', 'mod-06', 'mod-07', 'mod-05', 'mod-02', 'mod-03', 'mod-01', 'mod-04'],
    helperTone: 'I will point you toward release safety and automation.',
  },
  {
    id: 'career-switcher',
    label: 'Career Mode',
    focus: 'Portfolio proof, interview stories, and job-ready Git confidence.',
    recommendedModules: ['mod-01', 'mod-04', 'mod-05', 'mod-02', 'mod-03', 'mod-07', 'mod-06', 'mod-08'],
    helperTone: 'I will connect each lesson to portfolio and interview outcomes.',
  },
]

const CHALLENGE_TEMPLATES = [
  {
    title: 'Branch Rescue',
    brief: 'A teammate mixed feature work into main. Create a clean recovery plan before anyone force pushes.',
    command: 'git switch -c rescue/clean-history',
    reward: 180,
    moduleId: 'mod-06',
  },
  {
    title: 'CI Fire Drill',
    brief: 'The build failed after a merge. Find the likely commit, open a fix branch, and keep the release moving.',
    command: 'git log --oneline -n 8',
    reward: 220,
    moduleId: 'mod-08',
  },
  {
    title: 'Review Ready PR',
    brief: 'Your feature works, but the branch has noisy commits. Prepare it for a calm teammate review.',
    command: 'git rebase -i origin/main',
    reward: 200,
    moduleId: 'mod-05',
  },
  {
    title: 'Conflict Clinic',
    brief: 'Two developers edited the same layout file. Resolve the conflict and explain the final choice.',
    command: 'git fetch origin && git merge origin/main',
    reward: 160,
    moduleId: 'mod-07',
  },
]

function getWeekKey(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  const dayMs = 24 * 60 * 60 * 1000
  const week = Math.ceil((((date.getTime() - start.getTime()) / dayMs) + start.getDay() + 1) / 7)
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function buildWeeklyChallenge(role: LearningRole): WeeklyChallenge {
  const weekKey = getWeekKey()
  const seed = [...weekKey, ...role].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const template = CHALLENGE_TEMPLATES[seed % CHALLENGE_TEMPLATES.length]
  const rolePath = ROLE_PATHS.find(path => path.id === role) || ROLE_PATHS[0]

  return {
    id: `${weekKey}-${role}-${template.title.toLowerCase().replace(/\s+/g, '-')}`,
    title: template.title,
    brief: template.brief,
    rolePrompt: `${rolePath.label} focus: ${rolePath.focus}`,
    command: template.command,
    reward: template.reward,
    moduleId: template.moduleId,
  }
}

/** Curriculum data — free YouTube videos from reputable channels */
const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 'mod-01',
    num: '01',
    title: 'Git & GitHub Crash Course [2026]',
    description: 'Learn Git and GitHub from scratch with clear examples, real workflows, branching, merging, stashing, rebase, pull requests, and more.',
    youtubeId: 'mAFoROnOfHs',
    channel: 'freeCodeCamp.org',
    duration: '1h 21min',
    difficulty: 'Beginner',
    tags: ['git', 'github', 'basics'],
  },
  {
    id: 'mod-02',
    num: '02',
    title: 'Git and GitHub for Beginners',
    description: 'Complete crash course covering repositories, commits, branching, merging, SSH keys, and the full GitHub workflow.',
    youtubeId: 'RGOj5yH7evk',
    channel: 'freeCodeCamp.org',
    duration: '1h 10min',
    difficulty: 'Beginner',
    tags: ['git', 'workflow', 'ssh'],
  },
  {
    id: 'mod-03',
    num: '03',
    title: 'Git & GitHub Crash Course 2025',
    description: 'Traversy Media covers all core Git commands and the complete workflow to start using Git professionally.',
    youtubeId: 'vA5TTz6BXhY',
    channel: 'Traversy Media',
    duration: '49min',
    difficulty: 'Beginner',
    tags: ['commands', 'workflow'],
  },
  {
    id: 'mod-04',
    num: '04',
    title: 'Git and GitHub Tutorial for Beginners',
    description: 'Step-by-step tutorial from Kevin Stratvert covering source control, branching, merging, pull requests, and collaboration.',
    youtubeId: 'tRZGeaHPoaw',
    channel: 'Kevin Stratvert',
    duration: '45min',
    difficulty: 'Beginner',
    tags: ['collaboration', 'pull-requests'],
  },
  {
    id: 'mod-05',
    num: '05',
    title: 'Complete Git and GitHub Tutorial',
    description: 'Deep dive into branching, forking, pull requests, squashing, rebasing, and contributing to open source by Kunal Kushwaha.',
    youtubeId: 'apGV9Kg7ics',
    channel: 'Kunal Kushwaha',
    duration: '1h 11min',
    difficulty: 'Intermediate',
    tags: ['open-source', 'rebase', 'squash'],
  },
  {
    id: 'mod-06',
    num: '06',
    title: 'Git Advanced — Professional Tips',
    description: 'Master advanced Git concepts including rebase, cherry-pick, stash, revert, and keeping a clean commit history.',
    youtubeId: 'l2yrJtwoC_E',
    channel: 'GitKraken / freeCodeCamp',
    duration: '1h 53min',
    difficulty: 'Advanced',
    tags: ['advanced', 'rebase', 'cherry-pick'],
  },
  {
    id: 'mod-07',
    num: '07',
    title: 'Git Branching and Merging Explained',
    description: 'Everything you need to know about Git branches — creating, switching, merging, resolving conflicts, and strategies.',
    youtubeId: 'hNdrIIgK1rk',
    channel: 'TechWorld with Nana',
    duration: '35min',
    difficulty: 'Intermediate',
    tags: ['branching', 'merging', 'conflicts'],
  },
  {
    id: 'mod-08',
    num: '08',
    title: 'GitHub Actions CI/CD Tutorial',
    description: 'Automate your deployments with GitHub Actions — build, test, and deploy your code automatically on every push.',
    youtubeId: 'R8_veQiYBjI',
    channel: 'TechWorld with Nana',
    duration: '42min',
    difficulty: 'Intermediate',
    tags: ['ci-cd', 'automation', 'devops'],
  },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth()
  const [role, setRoleState] = useState<LearningRole>(() => {
    return (localStorage.getItem('devflow_role') as LearningRole | null) || 'junior-dev'
  })
  const [githubProfile, setGitHubProfile] = useState<GitHubProfile | null>(() => {
    const saved = localStorage.getItem('devflow_github_profile')
    return saved ? JSON.parse(saved) : null
  })

  // ---- Curriculum Panel State ----
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // ---- Review State ----
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  // "Did I submit a review" is now a real, server-verified fact tied to
  // the account (see api/_lib/users.ts) — not a flag that could be
  // cleared by clearing the browser. Guests (no account) are always false.
  const hasSubmittedReview = !!user?.hasReviewedCourse

  // ---- Public reviews — shared across everyone, via /api/reviews ----
  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [reviewsError, setReviewsError] = useState<string | null>(null)

  const refreshReviews = useCallback(async () => {
    setIsLoadingReviews(true)
    setReviewsError(null)
    try {
      const response = await fetch('/api/reviews')
      const data = await response.json()
      if (!response.ok) {
        setReviewsError(data.error || 'Could not load reviews.')
        return
      }
      setReviews(Array.isArray(data.reviews) ? data.reviews : [])
    } catch {
      setReviewsError('Could not reach the server to load reviews.')
    } finally {
      setIsLoadingReviews(false)
    }
  }, [])

  useEffect(() => {
    refreshReviews()
  }, [refreshReviews])

  // ---- Leaderboard — shared across everyone, via /api/leaderboard ----
  // Backed by a real Postgres table (db/schema.sql) rather than Redis —
  // ranking users by summed points is a GROUP BY + RANK() query, which
  // doesn't fit the flat key-value shape everything else in this app uses.
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true)

  const refreshLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true)
    try {
      const response = await fetch(`/api/leaderboard?week=${encodeURIComponent(getWeekKey())}`)
      const data = await response.json()
      setLeaderboard(Array.isArray(data.entries) ? data.entries : [])
    } catch {
      // Leave whatever was last successfully loaded in place — the
      // leaderboard just won't refresh this time.
    } finally {
      setIsLoadingLeaderboard(false)
    }
  }, [])

  useEffect(() => {
    refreshLeaderboard()
  }, [refreshLeaderboard])

  // ---- Progress State ----
  // Guests: localStorage is the only source of truth, per browser.
  // Logged-in users: this state is populated from /api/progress below
  // (a real Postgres table — db/schema.sql) and every toggle syncs
  // there too, so progress survives a cleared browser or a new device.
  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    const saved = localStorage.getItem('devflow_progress_guest')
    return saved ? JSON.parse(saved) : []
  })
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const prevUserIdRef = useRef<string | null>(null)

  // Fetch real progress whenever a real account becomes available
  // (fresh login, or page load with an existing session cookie).
  useEffect(() => {
    if (!user) return
    let cancelled = false
    setIsLoadingProgress(true)
    fetch('/api/progress', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        setCompletedModules(Array.isArray(data.completedModules) ? data.completedModules : [])
      })
      .catch(() => {
        // Network hiccup — leave whatever was already on screen (likely
        // the guest list) rather than wiping progress out from under the user.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProgress(false)
      })
    return () => { cancelled = true }
  }, [user])

  // On logout, fall back to the guest's local progress rather than
  // continuing to show the previous account's completed modules.
  useEffect(() => {
    if (prevUserIdRef.current && !user) {
      const saved = localStorage.getItem('devflow_progress_guest')
      setCompletedModules(saved ? JSON.parse(saved) : [])
    }
    prevUserIdRef.current = user?.id ?? null
  }, [user])

  const rolePath = useMemo(() => {
    return ROLE_PATHS.find(path => path.id === role) || ROLE_PATHS[0]
  }, [role])

  const modules = useMemo(() => {
    return [...CURRICULUM_MODULES].sort((a, b) => {
      return rolePath.recommendedModules.indexOf(a.id) - rolePath.recommendedModules.indexOf(b.id)
    })
  }, [rolePath])

  const weeklyChallenge = useMemo(() => buildWeeklyChallenge(role), [role])
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('devflow_completed_challenges')
    return saved ? JSON.parse(saved) : []
  })
  const hasCompletedWeeklyChallenge = completedChallengeIds.includes(weeklyChallenge.id)

  const setRole = useCallback((nextRole: LearningRole) => {
    setRoleState(nextRole)
    localStorage.setItem('devflow_role', nextRole)
  }, [])

  /** Open the curriculum panel, optionally focusing a specific module */
  const openCurriculum = useCallback((moduleId?: string) => {
    setActiveModuleId(moduleId || rolePath.recommendedModules[0] || CURRICULUM_MODULES[0].id)
    setIsCurriculumOpen(true)
  }, [rolePath])

  const closeCurriculum = useCallback(() => {
    setIsCurriculumOpen(false)
  }, [])

  const setActiveModule = useCallback((id: string) => {
    setActiveModuleId(id)
  }, [])

  // ---- Review Handlers ----
  const openReviewModal = useCallback(() => setIsReviewModalOpen(true), [])
  const closeReviewModal = useCallback(() => setIsReviewModalOpen(false), [])

  /**
   * Submit a review — posts to the shared /api/reviews backend, which
   * requires being logged in and enforces one review per account
   * server-side. The display name comes from the account server-side,
   * not from this request. On success, refreshUser() re-syncs
   * user.hasReviewedCourse from the server so hasSubmittedReview updates
   * everywhere immediately.
   */
  const submitReview = useCallback(async (rating: number, comment: string): Promise<{ ok: boolean; message: string }> => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })
      const data = await response.json()

      if (!response.ok) {
        return { ok: false, message: data.error || 'Could not submit your review. Please try again.' }
      }

      setIsReviewModalOpen(false)
      // Optimistically show the new review immediately, then reconcile with the server.
      if (data.review) setReviews(prev => [data.review, ...prev])
      refreshReviews()
      await refreshUser()

      return { ok: true, message: 'Review submitted — thanks!' }
    } catch {
      return { ok: false, message: 'Could not reach the server. Please check your connection and try again.' }
    }
  }, [refreshReviews, refreshUser])

  // ---- Progress Handlers ----
  /**
   * Toggle a module's completion status. Updates on-screen state
   * immediately either way. Logged-in users sync the change to
   * /api/progress (best-effort — a failed request doesn't roll back
   * the UI, it just means the next load reconciles from the server).
   * Guests persist to a local, per-browser localStorage key instead,
   * since there's no account to attach server-side progress to.
   */
  const toggleModuleComplete = useCallback((id: string) => {
    setCompletedModules(prev => {
      const willComplete = !prev.includes(id)
      const next = willComplete ? [...prev, id] : prev.filter(m => m !== id)

      if (user) {
        fetch('/api/progress', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId: id, completed: willComplete }),
        }).catch(() => {
          // Best-effort — local state already reflects the toggle.
        })
      } else {
        localStorage.setItem('devflow_progress_guest', JSON.stringify(next))
      }

      return next
    })
  }, [user])

  const connectGitHub = useCallback(async (username: string) => {
    const cleaned = username.trim().replace(/^@/, '')
    if (!cleaned) return { ok: false, message: 'Enter a GitHub username.' }

    try {
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(cleaned)}`)
      if (!response.ok) return { ok: false, message: 'GitHub user not found.' }

      const data = await response.json() as {
        login: string
        avatar_url: string
        html_url: string
        public_repos: number
        followers: number
      }
      const profile: GitHubProfile = {
        username: data.login,
        avatarUrl: data.avatar_url,
        profileUrl: data.html_url,
        publicRepos: data.public_repos,
        followers: data.followers,
      }

      setGitHubProfile(profile)
      localStorage.setItem('devflow_github_profile', JSON.stringify(profile))
      return { ok: true, message: `Connected @${profile.username}.` }
    } catch {
      return { ok: false, message: 'Could not reach GitHub right now.' }
    }
  }, [])

  const disconnectGitHub = useCallback(() => {
    setGitHubProfile(null)
    localStorage.removeItem('devflow_github_profile')
  }, [])

  /**
   * Marks the current weekly challenge complete. The local "have I
   * completed this" flag (below) is what actually gates the UI — same
   * pattern as hasSubmittedReview — so it updates instantly regardless
   * of network conditions. The POST to /api/leaderboard is best-effort:
   * it's what gets the points onto the real, shared leaderboard, but a
   * hiccup there shouldn't block the user from seeing their own
   * "completed" state update immediately.
   */
  const completeWeeklyChallenge = useCallback(async () => {
    setCompletedChallengeIds(prev => {
      if (prev.includes(weeklyChallenge.id)) return prev
      const next = [...prev, weeklyChallenge.id]
      localStorage.setItem('devflow_completed_challenges', JSON.stringify(next))
      return next
    })

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: weeklyChallenge.reward,
          weekKey: getWeekKey(),
          challengeId: weeklyChallenge.id,
        }),
      })
      refreshLeaderboard()
    } catch {
      // Points just won't show up on the shared leaderboard until the
      // next successful sync — the user's own completed state is unaffected.
    }
  }, [weeklyChallenge, refreshLeaderboard])

  // Course is complete when ALL modules are done AND a review is submitted
  const allModulesDone = completedModules.length === CURRICULUM_MODULES.length
  const isCourseComplete = allModulesDone && hasSubmittedReview

  return (
    <AppContext.Provider value={{
      role,
      rolePath,
      setRole,
      isCurriculumOpen,
      activeModuleId,
      openCurriculum,
      closeCurriculum,
      setActiveModule,
      isReviewModalOpen,
      hasSubmittedReview,
      openReviewModal,
      closeReviewModal,
      submitReview,
      reviews,
      isLoadingReviews,
      reviewsError,
      refreshReviews,
      completedModules,
      toggleModuleComplete,
      isCourseComplete,
      isLoadingProgress,
      githubProfile,
      connectGitHub,
      disconnectGitHub,
      weeklyChallenge,
      hasCompletedWeeklyChallenge,
      completeWeeklyChallenge,
      leaderboard,
      isLoadingLeaderboard,
      refreshLeaderboard,
      modules,
    }}>
      {children}
    </AppContext.Provider>
  )
}

/** Hook to consume app context */
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

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
 * - Review submission state (required before course completion)
 * - Completed modules tracking
 * ============================================================================
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
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
  submitReview: (rating: number, comment: string) => void

  // Progress
  completedModules: string[]
  toggleModuleComplete: (id: string) => void
  isCourseComplete: boolean

  // GitHub integration
  githubProfile: GitHubProfile | null
  connectGitHub: (username: string) => Promise<{ ok: boolean; message: string }>
  disconnectGitHub: () => void

  // Weekly challenge
  weeklyChallenge: WeeklyChallenge
  hasCompletedWeeklyChallenge: boolean
  completeWeeklyChallenge: () => void

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
  const { user } = useAuth()
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
  const [hasSubmittedReview, setHasSubmittedReview] = useState(() => {
    return !!localStorage.getItem('devflow_review_submitted')
  })

  // ---- Progress State ----
  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    const saved = localStorage.getItem(`devflow_progress_${user?.id || 'guest'}`)
    return saved ? JSON.parse(saved) : []
  })

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

  /** Submit a review — marks the review as submitted and persists it */
  const submitReview = useCallback((rating: number, comment: string) => {
    const reviews = JSON.parse(localStorage.getItem('devflow_reviews') || '[]')
    reviews.push({
      rating,
      comment,
      date: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      userName: user?.name || 'Anonymous',
    })
    localStorage.setItem('devflow_reviews', JSON.stringify(reviews))
    localStorage.setItem('devflow_review_submitted', 'true')
    setHasSubmittedReview(true)
    setIsReviewModalOpen(false)
  }, [user])

  // ---- Progress Handlers ----
  /** Toggle a module's completion status and persist to localStorage */
  const toggleModuleComplete = useCallback((id: string) => {
    setCompletedModules(prev => {
      const next = prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
      localStorage.setItem(`devflow_progress_${user?.id || 'guest'}`, JSON.stringify(next))
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

  const completeWeeklyChallenge = useCallback(() => {
    setCompletedChallengeIds(prev => {
      if (prev.includes(weeklyChallenge.id)) return prev
      const next = [...prev, weeklyChallenge.id]
      localStorage.setItem('devflow_completed_challenges', JSON.stringify(next))
      return next
    })
  }, [weeklyChallenge])

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
      completedModules,
      toggleModuleComplete,
      isCourseComplete,
      githubProfile,
      connectGitHub,
      disconnectGitHub,
      weeklyChallenge,
      hasCompletedWeeklyChallenge,
      completeWeeklyChallenge,
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

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

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

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

  // Curriculum data
  modules: CurriculumModule[]
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

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

  /** Open the curriculum panel, optionally focusing a specific module */
  const openCurriculum = useCallback((moduleId?: string) => {
    setActiveModuleId(moduleId || CURRICULUM_MODULES[0].id)
    setIsCurriculumOpen(true)
  }, [])

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

  // Course is complete when ALL modules are done AND a review is submitted
  const allModulesDone = completedModules.length === CURRICULUM_MODULES.length
  const isCourseComplete = allModulesDone && hasSubmittedReview

  return (
    <AppContext.Provider value={{
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
      modules: CURRICULUM_MODULES,
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

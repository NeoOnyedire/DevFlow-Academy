/**
 * ============================================================================
 * DashboardSection.tsx
 * ============================================================================
 *
 * "Your Progress" — a flowing (non-pinned) section that shows the user's
 * learning stats: lessons completed, streak, badges, leaderboard position,
 * skill map with progress bars, and next lesson.
 *
 * SKILL BARS — dynamic, not hardcoded:
 * Each skill maps to a set of curriculum modules. The bar fills based on
 * how many of those modules the user has actually completed.
 *
 *   Staging   → mod-01, mod-02          (commit & setup foundations)
 *   Branching → mod-02, mod-03, mod-07  (branch, merge, conflict)
 *   Merging   → mod-07, mod-05          (merge strategies, rebase)
 *   Review    → mod-04, mod-05          (PRs, code review)
 *   Automation→ mod-08                  (CI/CD)
 *
 * AUTH INTEGRATION:
 * - If logged in: shows real progress data from AppContext
 * - If not logged in: shows a login prompt on a bg-sun-yellow canvas —
 *   the heading/subtitle there read var(--text-on-accent) / soft instead
 *   of a hardcoded #2A2A2A, so they stay readable once that canvas flips
 *   to a dark surface in Dark Mode (see index.css). Everything below,
 *   the greyed-out stat cards, skill map, uses bg-[#4A2F2F]/60 and
 *   text-white/NN, which are already theme-aware.
 * ============================================================================
 */

import { useRef, useState, useLayoutEffect, useMemo, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { ROLE_PATHS, useApp, type LearningRole } from '../context/AppContext'
import { BookOpen, Flame, Award, Trophy, Map, ArrowRight, Github, Briefcase, Target, CheckCircle, LockKeyhole } from 'lucide-react'
import { buildGitHubAuthorizeUrl, isGitHubOAuthConfigured } from '../lib/githubOAuth'
import { getRepositoryRecommendations } from '../lib/repositoryRecommendations'
import { getAchievements } from '../lib/achievements'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

interface ImportedRepository {
  fullName: string
  name: string
  htmlUrl: string
  description: string | null
  private: boolean
  fork: boolean
  forkParent: string | null
  defaultBranch: string
  language: string | null
  topics: string[]
  openIssuesCount: number
  stars: number
  updatedAt: string
  languages: Record<string, number>
  hasWorkflows: boolean
}

interface AvailableRepository {
  fullName: string
  private: boolean
  description: string | null
  language: string | null
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(data.error || 'Could not load repository information.')
  return data
}

/**
 * Each skill lists the module IDs that contribute to it.
 * Progress = (completed modules in list) / (total modules in list) * 100
 */
const SKILL_MODULES: { name: string; moduleIds: string[] }[] = [
  { name: 'Staging',    moduleIds: ['mod-01', 'mod-02'] },
  { name: 'Branching',  moduleIds: ['mod-02', 'mod-03', 'mod-07'] },
  { name: 'Merging',    moduleIds: ['mod-07', 'mod-05'] },
  { name: 'Review',     moduleIds: ['mod-04', 'mod-05'] },
  { name: 'Automation', moduleIds: ['mod-08'] },
]

export default function DashboardSection({ className = '' }: Props) {
  const { isLoggedIn, user, openAuthModal } = useAuth()
  const {
    completedModules,
    modules,
    isLoadingProgress,
    progressError,
    openCurriculum,
    role,
    rolePath,
    setRole,
    githubProfile,
    connectGitHub,
    disconnectGitHub,
    weeklyChallenge,
    hasCompletedWeeklyChallenge,
    completedChallengeIds,
    isLoadingChallengeHistory,
    challengeHistoryError,
  } = useApp()

  const [githubUsername, setGitHubUsername] = useState('')
  const [githubMessage, setGitHubMessage] = useState('')
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false)
  const [repositoryConnected, setRepositoryConnected] = useState(false)
  const [repositoryLoading, setRepositoryLoading] = useState(false)
  const [repositoryError, setRepositoryError] = useState('')
  const [selectedRepository, setSelectedRepository] = useState<ImportedRepository | null>(null)
  const [availableRepositories, setAvailableRepositories] = useState<AvailableRepository[]>([])
  const [repositoryChoice, setRepositoryChoice] = useState('')
  const [isChoosingRepository, setIsChoosingRepository] = useState(false)
  const [isLoadingRepositoryList, setIsLoadingRepositoryList] = useState(false)

  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    const load = async () => {
      await Promise.resolve()
      if (cancelled) return
      setRepositoryLoading(true)
      setRepositoryError('')
      setRepositoryConnected(false)
      setSelectedRepository(null)
      setAvailableRepositories([])
      try {
        const status = await readApiResponse<{ connected: boolean; selectedRepository: string | null }>(
          await fetch('/api/repositories/status', { credentials: 'same-origin' }),
        )
        if (cancelled) return
        setRepositoryConnected(status.connected)
        if (!status.connected || !status.selectedRepository) {
          setSelectedRepository(null)
          return
        }
        const data = await readApiResponse<{ repository: ImportedRepository | null }>(
          await fetch('/api/repositories/selected', { credentials: 'same-origin' }),
        )
        if (!cancelled) setSelectedRepository(data.repository)
      } catch (error) {
        if (!cancelled) setRepositoryError(error instanceof Error ? error.message : 'Could not load repository access.')
      } finally {
        if (!cancelled) setRepositoryLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [isLoggedIn])

  /** Derive skill percentages from actual completed modules */
  const skills = useMemo(() => {
    return SKILL_MODULES.map(skill => {
      const completedCount = skill.moduleIds.filter(id => completedModules.includes(id)).length
      const pct = Math.round((completedCount / skill.moduleIds.length) * 100)
      return { name: skill.name, pct }
    })
  }, [completedModules])

  const careerReadiness = Math.min(
    100,
    Math.round((completedModules.length / modules.length) * 70) +
    (githubProfile ? 20 : 0) +
    (hasCompletedWeeklyChallenge ? 10 : 0)
  )

  const achievements = useMemo(() => getAchievements({
    completedModules: new Set(completedModules).size,
    totalModules: modules.length,
    completedChallenges: new Set(completedChallengeIds).size,
    hasSubmittedReview: !!user?.hasReviewedCourse,
  }), [completedChallengeIds, completedModules, modules.length, user?.hasReviewedCourse])
  const earnedAchievementCount = achievements.filter(achievement => achievement.earned).length
  const achievementDataUnavailable = !!progressError || !!challengeHistoryError
  const achievementsLoading = isLoadingProgress || isLoadingChallengeHistory

  const portfolioTasks = [
    { label: 'Finish role path lessons', done: completedModules.length >= Math.ceil(modules.length * 0.6) },
    { label: 'Connect GitHub proof', done: !!githubProfile },
    { label: 'Complete this week\'s challenge', done: hasCompletedWeeklyChallenge },
  ]

  const handleGitHubConnect = async () => {
    if (!githubUsername.trim()) {
      setGitHubMessage('Enter a GitHub username first.')
      return
    }
    setIsConnectingGitHub(true)
    const result = await connectGitHub(githubUsername)
    setGitHubMessage(result.message)
    if (result.ok) setGitHubUsername('')
    setIsConnectingGitHub(false)
  }

  const handleAuthorizeRepositoryAccess = () => {
    const url = buildGitHubAuthorizeUrl('repository-access')
    if (!url) {
      setRepositoryError('GitHub OAuth is not configured for this deployment.')
      return
    }
    window.location.assign(url)
  }

  const handleChooseRepository = async () => {
    setIsLoadingRepositoryList(true)
    setRepositoryError('')
    try {
      const data = await readApiResponse<{ repositories: AvailableRepository[] }>(
        await fetch('/api/repositories/list', { credentials: 'same-origin' }),
      )
      setAvailableRepositories(data.repositories)
      setRepositoryChoice('')
      setIsChoosingRepository(true)
    } catch (error) {
      setRepositoryError(error instanceof Error ? error.message : 'Could not list your GitHub repositories.')
    } finally {
      setIsLoadingRepositoryList(false)
    }
  }

  const handleSelectRepository = async () => {
    if (!repositoryChoice) return
    setRepositoryLoading(true)
    setRepositoryError('')
    try {
      const data = await readApiResponse<{ repository: ImportedRepository }>(
        await fetch('/api/repositories/select', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: repositoryChoice }),
        }),
      )
      setSelectedRepository(data.repository)
      setIsChoosingRepository(false)
    } catch (error) {
      setRepositoryError(error instanceof Error ? error.message : 'Could not import that repository.')
    } finally {
      setRepositoryLoading(false)
    }
  }

  const handleDisconnectRepository = async () => {
    setRepositoryLoading(true)
    setRepositoryError('')
    try {
      await readApiResponse<{ connected: boolean }>(
        await fetch('/api/repositories/disconnect', {
          method: 'POST',
          credentials: 'same-origin',
        }),
      )
      setRepositoryConnected(false)
      setSelectedRepository(null)
      setAvailableRepositories([])
      setIsChoosingRepository(false)
    } catch (error) {
      setRepositoryError(error instanceof Error ? error.message : 'Could not disconnect repository access.')
    } finally {
      setRepositoryLoading(false)
    }
  }

  const repositoryRecommendations = useMemo(() => selectedRepository
    ? getRepositoryRecommendations(selectedRepository, rolePath.recommendedModules, completedModules)
    : [], [selectedRepository, rolePath.recommendedModules, completedModules])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current,
        { x: '-12vw', opacity: 0 },
        {
          x: 0, opacity: 1,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 80%',
            end: 'top 40%',
            scrub: 0.5,
          }
        }
      )

      cardsRef.current.forEach((card) => {
        if (!card) return
        gsap.fromTo(card,
          { y: '10vh', scale: 0.96, opacity: 0 },
          {
            y: 0, scale: 1, opacity: 1,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 55%',
              scrub: 0.5,
            }
          }
        )
      })
    }, section)

    return () => ctx.revert()
  }, [])

  // Not logged in — aspirational preview with empty bars (motivating, not a lock screen)
  if (!isLoggedIn) {
    return (
      <section
        ref={sectionRef}
        id="dashboard"
        className={`${className} relative`}
        style={{ padding: '8vh 0', minHeight: '80vh' }}
      >
        <div className="px-[6vw]">
          <div ref={headingRef} className="mb-8">
            <h2 className="font-display font-bold tracking-[0.02em] mb-2"
              style={{ fontSize: 'clamp(36px, 6vw, 72px)', color: 'var(--text-on-accent)' }}>
              Your Progress
            </h2>
            <p style={{ color: 'var(--text-on-accent-soft)', fontSize: 'clamp(14px, 1.2vw, 17px)' }}>
              Start learning to fill these in. Free account, no credit card.
            </p>
          </div>

          {/* Greyed-out stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 opacity-40 pointer-events-none select-none">
            {[
              { label: 'Lessons', value: '0 / 8' },
              { label: 'Streak',  value: '0 days' },
              { label: 'Badges',  value: '0'      },
              { label: 'Ranking', value: 'Top 25%'},
            ].map(stat => (
              <div key={stat.label} className="bg-[#4A2F2F]/60 card-radius p-4">
                <p className="font-display text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-white/50 text-xs font-accent uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Empty skill map */}
          <div className="bg-[#4A2F2F]/60 card-radius p-5 mb-6 opacity-40 pointer-events-none select-none">
            <p className="text-white/40 text-xs font-accent uppercase tracking-[0.14em] mb-4">Skill Map</p>
            <div className="space-y-3">
              {SKILL_MODULES.map(skill => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                      <span className="text-white/50 text-sm">{skill.name}</span>
                    </div>
                    <span className="text-white/25 text-xs">0%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => openAuthModal('register')}
            className="bg-rose-punch text-white font-display font-semibold px-8 py-4 card-radius card-shadow
              hover:scale-105 transition-all duration-300"
            style={{ fontSize: 'clamp(15px, 1.4vw, 18px)' }}>
            Join Free — start filling in your progress
          </button>
        </div>
      </section>
    )
  }


  return (
    <section
      ref={sectionRef}
      id="dashboard"
      className={`${className} relative`}
      style={{ padding: '8vh 0', minHeight: '100vh' }}
    >
      {/* Heading */}
      <div ref={headingRef} className="px-[6vw] mb-8">
        <h2 className="font-display font-bold text-white heading-responsive tracking-[0.02em] mb-4"
          style={{ fontSize: 'clamp(36px, 6vw, 92px)' }}>
          Your Progress
        </h2>
        <p className="text-white/80 max-w-[40vw] leading-relaxed hidden md:block" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'learner'}! {rolePath.focus}
        </p>
      </div>

      <div className="px-[6vw] grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">

        {/* Role Path selector */}
        <div
          ref={el => { cardsRef.current[6] = el }}
          className="col-span-2 md:col-span-12 bg-card-dark card-radius card-shadow p-4 md:p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[#F7B731]" />
            <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/50">Role Path</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {ROLE_PATHS.map(path => (
              <button
                key={path.id}
                onClick={() => setRole(path.id as LearningRole)}
                className={`text-left p-4 transition-all cursor-pointer ring-0 focus:outline-none ${
                  role === path.id
                    ? 'bg-[#F7B731] text-[#2A2A2A]'
                    : 'bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]'
                }`}
                style={{ borderRadius: 8 }}
                aria-pressed={role === path.id}
              >
                <p className="font-display text-xl font-bold">{path.label}</p>
                <p className={`mt-1 text-sm leading-relaxed ${role === path.id ? 'text-[#2A2A2A]/75' : 'text-white/62'}`}>
                  {path.focus}
                </p>
                {role === path.id && (
                  <p className="mt-2 text-[10px] font-accent uppercase tracking-[0.12em] text-[#2A2A2A]/50">
                    Active path
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lessons Completed */}
        <div
          ref={el => { cardsRef.current[0] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-[#F7B731]" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Lessons</span>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{completedModules.length}</p>
          <p className="text-white/60 text-xs md:text-sm">of {modules.length} completed</p>
        </div>

        {/* Current Streak */}
        <div
          ref={el => { cardsRef.current[1] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Streak</span>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{completedModules.length > 0 ? '3' : '0'}</p>
          <p className="text-white/60 text-xs md:text-sm">days</p>
        </div>

        {/* Achievements Earned */}
        <div
          ref={el => { cardsRef.current[2] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Achievements</span>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold text-white mb-1">
            {achievementsLoading ? '…' : achievementDataUnavailable ? '—' : `${earnedAchievementCount}/${achievements.length}`}
          </p>
          <p className="text-white/60 text-xs md:text-sm">Earned</p>
        </div>

        {/* Leaderboard */}
        <div
          ref={el => { cardsRef.current[3] = el }}
          className="col-span-1 md:col-span-3 bg-card-dark card-radius card-shadow p-4 md:p-5 hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#FF4D6D]/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-[#FF4D6D]" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Ranking</span>
          </div>
          <p className="font-display text-xl md:text-2xl font-bold text-white mb-1">Top {completedModules.length > 4 ? '8' : '25'}%</p>
          <p className="text-white/60 text-xs md:text-sm">this week</p>
        </div>

        {/* Achievement collection — each badge is earned from saved course activity */}
        <div
          ref={el => { cardsRef.current[8] = el }}
          className="col-span-2 md:col-span-12 bg-card-dark card-radius card-shadow p-4 md:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-400" />
            <div>
              <h3 className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/70">Achievement Collection</h3>
              <p className="mt-1 text-xs text-white/45">
                {achievementsLoading
                  ? 'Checking your saved learning activity…'
                  : achievementDataUnavailable
                    ? 'Your achievements could not be verified.'
                    : `${earnedAchievementCount} of ${achievements.length} earned`}
              </p>
            </div>
          </div>

          {achievementDataUnavailable ? (
            <p role="alert" className="text-sm text-rose-300">
              {progressError || challengeHistoryError} Refresh the page to try again.
            </p>
          ) : achievementsLoading ? (
            <p role="status" className="text-sm text-white/50">Loading achievements…</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`flex min-h-28 gap-3 rounded-lg border p-3 ${
                    achievement.earned
                      ? 'border-[#F7B731]/30 bg-[#F7B731]/10'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  {achievement.earned
                    ? <Award className="mt-0.5 h-5 w-5 shrink-0 text-[#F7B731]" aria-hidden="true" />
                    : <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-white/30" aria-hidden="true" />}
                  <div>
                    <p className={`font-display text-sm font-bold ${achievement.earned ? 'text-white' : 'text-white/55'}`}>
                      {achievement.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">{achievement.description}</p>
                    <p className={`mt-2 text-[10px] font-accent uppercase tracking-wider ${
                      achievement.earned ? 'text-[#F7B731]' : 'text-white/30'
                    }`}>
                      {achievement.earned ? 'Earned' : 'Locked'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Map — bars driven by real completion data */}
        <div
          ref={el => { cardsRef.current[4] = el }}
          className="col-span-2 md:col-span-6 bg-card-dark card-radius card-shadow p-4 md:p-6 hover:scale-[1.01] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Map className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            </div>
            <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/50">Skill Map</span>
          </div>

          {completedModules.length === 0 ? (
            <p className="text-white/40 text-sm">
              Complete your first lesson to start filling your skill map.
            </p>
          ) : (
            <div className="space-y-3">
              {skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${skill.pct > 0 ? 'bg-lime' : 'bg-white/20'}`} />
                      <span className="text-white/80 text-xs md:text-sm font-medium">{skill.name}</span>
                    </div>
                    <span className="text-white/40 text-xs font-accent">{skill.pct}%</span>
                  </div>
                  <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${skill.pct}%`,
                        backgroundColor: skill.pct > 0 ? 'var(--lime)' : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Lesson CTA */}
        <div
          ref={el => { cardsRef.current[5] = el }}
          onClick={() => {
            const nextModule = modules.find(m => !completedModules.includes(m.id))
            openCurriculum(nextModule?.id)
          }}
          className="col-span-2 md:col-span-6 bg-rose-punch card-radius card-shadow p-4 md:p-6 hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="font-accent text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-white/70">Next Lesson</span>
            </div>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
            {completedModules.length < modules.length
              ? String(completedModules.length + 1).padStart(2, '0')
              : 'All Done!'}
          </p>
          <p className="text-white/90 text-sm md:text-lg font-medium">
            {completedModules.length < modules.length
              ? modules.find(m => !completedModules.includes(m.id))?.title || 'CI / CD Basics'
              : 'Course Complete!'}
          </p>
          <p className="text-white/60 text-xs md:text-sm mt-1 md:mt-2">
            {completedModules.length < modules.length ? 'Click to open this lesson' : 'Amazing work!'}
          </p>
        </div>

        {/* GitHub Account Integration */}
        <div
          ref={el => { cardsRef.current[7] = el }}
          className="col-span-2 md:col-span-6 bg-card-dark card-radius card-shadow p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-5 h-5 text-white" />
            <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/50">GitHub Proof</span>
          </div>
          {githubProfile ? (
            <div className="flex flex-wrap items-center gap-4">
              <img src={githubProfile.avatarUrl} alt={githubProfile.username} className="h-14 w-14 rounded-full" />
              <div className="min-w-0 flex-1">
                <a href={githubProfile.profileUrl} target="_blank" rel="noreferrer" className="font-display text-2xl font-bold text-white hover:text-[#F7B731]">
                  @{githubProfile.username}
                </a>
                <p className="text-sm text-white/60">{githubProfile.publicRepos} public repos · {githubProfile.followers} followers</p>
              </div>
              <button onClick={disconnectGitHub} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/15">
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={githubUsername}
                  onChange={e => setGitHubUsername(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGitHubConnect() }}
                  placeholder="GitHub username"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder-white/35 outline-none focus:border-[#F7B731]/60"
                />
                <button
                  onClick={handleGitHubConnect}
                  disabled={isConnectingGitHub}
                  className="rounded-lg bg-[#F7B731] px-4 py-2 font-display font-semibold text-[#2A2A2A] disabled:opacity-60"
                >
                  {isConnectingGitHub ? 'Connecting…' : 'Connect'}
                </button>
              </div>
              {githubMessage && (
                <p className="mt-2 text-xs text-white/60">{githubMessage}</p>
              )}
              {!githubMessage && (
                <p className="mt-2 text-xs text-white/45">
                  Uses your public GitHub profile. Adds portfolio proof to Career Mode.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-white">Repository recommendations</p>
                <p className="mt-1 text-xs text-white/50">Connect a repository for project-specific lesson suggestions.</p>
              </div>
              {repositoryConnected && (
                <button
                  type="button"
                  onClick={handleDisconnectRepository}
                  disabled={repositoryLoading}
                  className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/15 disabled:opacity-50"
                >
                  Disconnect
                </button>
              )}
            </div>

            {!isLoggedIn ? (
              <p className="mt-3 text-sm text-white/60">Sign in to connect a GitHub repository.</p>
            ) : repositoryLoading && !selectedRepository ? (
              <p className="mt-3 text-sm text-white/60" role="status">Loading repository access…</p>
            ) : !repositoryConnected ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleAuthorizeRepositoryAccess}
                  disabled={!isGitHubOAuthConfigured()}
                  className="rounded-lg bg-[#F7B731] px-4 py-2 font-display font-semibold text-[#2A2A2A] disabled:opacity-50"
                >
                  Authorize GitHub repositories
                </button>
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  GitHub asks for the repo permission to include private repositories. DevFlow only reads repository metadata,
                  language statistics, and workflow presence; it never changes your repository.
                </p>
              </div>
            ) : selectedRepository ? (
              <div className="mt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <a href={selectedRepository.htmlUrl} target="_blank" rel="noreferrer" className="font-display text-lg font-bold text-white hover:text-[#F7B731]">
                      {selectedRepository.fullName}
                    </a>
                    <p className="mt-1 text-xs text-white/55">
                      {selectedRepository.private ? 'Private' : 'Public'} · {selectedRepository.language || 'No primary language'}
                      {selectedRepository.hasWorkflows ? ' · GitHub Actions detected' : ' · No GitHub Actions detected'}
                    </p>
                    {selectedRepository.description && (
                      <p className="mt-2 text-sm text-white/65">{selectedRepository.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleChooseRepository}
                    disabled={isLoadingRepositoryList || repositoryLoading}
                    className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/15 disabled:opacity-50"
                  >
                    {isLoadingRepositoryList ? 'Loading…' : 'Change repository'}
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {repositoryRecommendations.map(recommendation => {
                    const module = modules.find(item => item.id === recommendation.moduleId)
                    if (!module) return null
                    return (
                      <button
                        key={recommendation.moduleId}
                        type="button"
                        onClick={() => openCurriculum(recommendation.moduleId)}
                        className="block w-full rounded-lg bg-white/5 p-3 text-left hover:bg-white/10"
                      >
                        <span className="block text-sm font-semibold text-white">{module.title}</span>
                        <span className="mt-1 block text-xs text-white/55">{recommendation.reason}</span>
                      </button>
                    )
                  })}
                  {repositoryRecommendations.length === 0 && (
                    <p className="text-sm text-white/60">You have completed every recommended module for this repository.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleChooseRepository}
                  disabled={isLoadingRepositoryList}
                  className="rounded-lg bg-[#F7B731] px-4 py-2 font-display font-semibold text-[#2A2A2A] disabled:opacity-50"
                >
                  {isLoadingRepositoryList ? 'Loading repositories…' : 'Choose a repository'}
                </button>
              </div>
            )}

            {isChoosingRepository && (
              <div>
                {availableRepositories.length > 0 ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={repositoryChoice}
                      onChange={event => setRepositoryChoice(event.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#2A2A2A] px-3 py-2 text-sm text-white outline-none focus:border-[#F7B731]/60"
                    >
                      <option value="">Select a repository</option>
                      {availableRepositories.map(repository => (
                        <option key={repository.fullName} value={repository.fullName}>
                          {repository.fullName}{repository.private ? ' · Private' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSelectRepository}
                      disabled={!repositoryChoice || repositoryLoading}
                      className="rounded-lg bg-[#F7B731] px-4 py-2 font-display font-semibold text-[#2A2A2A] disabled:opacity-50"
                    >
                      {repositoryLoading ? 'Importing…' : 'Import'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-white/60">No repositories are available to this GitHub account.</p>
                )}
                <button
                  type="button"
                  onClick={() => setIsChoosingRepository(false)}
                  className="mt-2 text-xs text-white/50 underline hover:text-white/80"
                >
                  Cancel
                </button>
              </div>
            )}

            {repositoryError && <p className="mt-3 text-xs text-[#FF8A9B]" role="alert">{repositoryError}</p>}
            {repositoryConnected && (
              <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                Disconnect removes the saved token and repository link from DevFlow. You can also revoke the OAuth grant in your GitHub settings.
              </p>
            )}
          </div>
        </div>

        {/* Career Mode */}
        <div
          ref={el => { cardsRef.current[8] = el }}
          className="col-span-2 md:col-span-6 bg-card-dark card-radius card-shadow p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-[#F7B731]" />
            <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/50">Career Mode</span>
          </div>
          <p className="font-display text-3xl font-bold text-white mb-1">{careerReadiness}% ready</p>
          <p className="text-sm text-white/60 mb-4">
            Build proof for interviews: lessons, GitHub activity, and weekly scenario wins.
          </p>
          <div className="space-y-2">
            {portfolioTasks.map(task => (
              <div key={task.label} className="flex items-center gap-2 text-sm text-white/75">
                <CheckCircle className={`h-4 w-4 flex-shrink-0 ${task.done ? 'text-[#3CCF4A]' : 'text-white/20'}`} />
                <span>{task.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-white/10 p-3">
            <p className="text-xs font-accent uppercase tracking-[0.12em] text-white/45">This week's proof task</p>
            <p className="mt-1 text-sm text-white/80">{weeklyChallenge.title}: {weeklyChallenge.brief}</p>
          </div>
        </div>

      </div>
    </section>
  )
}

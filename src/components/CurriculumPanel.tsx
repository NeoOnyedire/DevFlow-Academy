import { useState, useEffect, useCallback } from 'react'
import { useApp, ROLE_PATHS, type LearningRole } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  X, Check, Play, Lock, Star, Award, ChevronRight, Route, List, Clock,
  Sparkles, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { hasGitterAiActivated } from '../lib/gitterKeys'
import { getLessonsForModule, type Lesson } from '../content/lessons'
import { fetchCompletedLessonIds, saveLessonStep } from '../lib/lessonProgress'
import LessonPlayer from './Curriculum/LessonPlayer'
import QuizStep from './Curriculum/QuizStep'
import GitSandbox from './Curriculum/GitSandbox'

// mod-00 is the only lesson guests can see without an account (see
// content/lessons.ts — ACCOUNT_SETUP_LESSON). mod-01 is the first "real"
// learning module, and completing IT is what requires Gitter AI to already
// be activated (see lib/gitterKeys.ts / ReviewModal.tsx's review gate).
// These used to be conflated under a single FREE_PREVIEW_MODULE constant —
// they're two different concepts now that mod-00 exists.
const GUEST_PREVIEW_MODULE = 'mod-00'
const GITTER_GATE_MODULE = 'mod-01'
const TOTAL_HOURS = '~7 hrs'

// Guests have no account to attach server-side lesson progress to
// (api/lesson-progress.ts requires login for both GET and POST), so their
// mod-00 checklist state lives here instead — same pattern as the guest
// module-progress fallback in AppContext.tsx.
const GUEST_TASK_STORAGE = 'devflow_guest_task_lessons'

type LessonStep = 'video' | 'quiz' | 'sandbox' | 'task' | 'recap'

function loadGuestTaskIds(): string[] {
  try {
    const saved = localStorage.getItem(GUEST_TASK_STORAGE)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export default function CurriculumPanel() {
  const {
    isCurriculumOpen, closeCurriculum, activeModuleId, setActiveModule,
    modules, completedModules, toggleModuleComplete, isCourseComplete,
    openReviewModal, hasSubmittedReview, rolePath, setRole,
  } = useApp()
  const { isLoggedIn, openAuthModal } = useAuth()

  const [mobileTab, setMobileTab] = useState<'watch' | 'modules'>('watch')
  const [rolePickerDismissed, setRolePickerDismissed] = useState(false)
  // Shown when a learner tries to complete Module 1 without having
  // activated Gitter AI yet — see finishLesson below.
  const [showGitterRequiredNotice, setShowGitterRequiredNotice] = useState(false)

  // ---- per-lesson state ----
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [lessonStep, setLessonStep] = useState<LessonStep>('video')
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)

  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0]
  const lessons = activeModule ? getLessonsForModule(activeModule.id) : []
  const currentLesson: Lesson | undefined = lessons[activeLessonIndex]

  const progressPercent = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0
  const isAllDone = modules.length > 0 && completedModules.length === modules.length
  const nextIncompleteModule = modules.find(m => !completedModules.includes(m.id))

  // Show role picker to logged-in users who haven't completed any module yet
  const shouldShowRolePicker = isLoggedIn && !rolePickerDismissed && completedModules.length === 0

  const canWatchModule = (moduleId: string) => isLoggedIn || moduleId === GUEST_PREVIEW_MODULE

  const stepForLesson = (lesson: Lesson | undefined): LessonStep =>
    lesson?.type === 'task' ? 'task' : 'video'

  const goToLesson = useCallback((index: number, lessonList: Lesson[] = lessons) => {
    setActiveLessonIndex(index)
    setLessonStep(stepForLesson(lessonList[index]))
  }, [lessons])

  // Load this module's lesson-completion state whenever the active module
  // (or auth state) changes, and jump straight to the first incomplete lesson.
  useEffect(() => {
    if (!activeModule) return
    const moduleLessons = getLessonsForModule(activeModule.id)
    let cancelled = false

    if (!isLoggedIn) {
      // Guests only ever reach mod-00 (canWatchModule gates the rest),
      // and it's tracked locally since there's no account to sync to.
      const guestIds = loadGuestTaskIds()
      setCompletedLessonIds(guestIds)
      setActiveLessonIndex(0)
      setLessonStep(stepForLesson(moduleLessons[0]))
      return
    }

    setIsLoadingLessons(true)
    fetchCompletedLessonIds(activeModule.id).then(ids => {
      if (cancelled) return
      const firstIncomplete = moduleLessons.findIndex(l => !ids.includes(l.id))
      const startIndex = firstIncomplete === -1 ? 0 : firstIncomplete
      setCompletedLessonIds(ids)
      setActiveLessonIndex(startIndex)
      setLessonStep(stepForLesson(moduleLessons[startIndex]))
      setIsLoadingLessons(false)
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule?.id, isLoggedIn])

  const handleModuleSelect = useCallback((id: string) => {
    setActiveModule(id)
    setShowGitterRequiredNotice(false)
    setMobileTab('watch')
  }, [setActiveModule])

  /** Marks the current lesson complete, persists it, rolls the module up if finished, advances. */
  const finishLesson = useCallback(async () => {
    if (!currentLesson || !activeModule) return

    // ---- Guests: local-only, no server write possible ----
    if (!isLoggedIn) {
      const next = Array.from(new Set([...completedLessonIds, currentLesson.id]))
      setCompletedLessonIds(next)
      localStorage.setItem(GUEST_TASK_STORAGE, JSON.stringify(next))
      return
    }

    // ---- Logged in: persist to /api/lesson-progress ----
    const allIds = lessons.map(l => l.id)
    const { moduleCompleted } = await saveLessonStep(currentLesson.id, activeModule.id, 'complete', allIds)
    const next = Array.from(new Set([...completedLessonIds, currentLesson.id]))
    setCompletedLessonIds(next)

    if (moduleCompleted && !completedModules.includes(activeModule.id)) {
      // Module 1 specifically requires Gitter AI to already be activated —
      // see the same gate that used to live in handleToggleComplete.
      if (activeModule.id === GITTER_GATE_MODULE && !hasGitterAiActivated()) {
        setShowGitterRequiredNotice(true)
        return
      }
      toggleModuleComplete(activeModule.id)
    }

    const nextIndex = activeLessonIndex + 1
    if (nextIndex < lessons.length) {
      goToLesson(nextIndex)
    } else if (moduleCompleted) {
      const nextModule = modules.find(m => !completedModules.includes(m.id) && m.id !== activeModule.id)
      if (nextModule) setTimeout(() => handleModuleSelect(nextModule.id), 500)
    }
  }, [
    currentLesson, activeModule, isLoggedIn, completedLessonIds, lessons,
    activeLessonIndex, completedModules, toggleModuleComplete, modules,
    goToLesson, handleModuleSelect,
  ])

  const handleRoleChoose = (chosenRole: LearningRole) => {
    setRole(chosenRole)
    setRolePickerDismissed(true)
  }

  if (!isCurriculumOpen) return null

  // ── Role picker interstitial ──
  const rolePicker = (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-6 py-8">
      <div className="w-14 h-14 rounded-full bg-[#F7B731]/20 flex items-center justify-center mb-4">
        <Route className="w-7 h-7 text-[#F7B731]" />
      </div>
      <h4 className="font-display font-bold text-white text-2xl mb-2">What describes you best?</h4>
      <p className="text-white/55 text-sm mb-8 max-w-sm">
        We'll personalise the module order and tips to match your goals. You can change this any time.
      </p>
      <div className="w-full max-w-sm space-y-3">
        {ROLE_PATHS.map(path => (
          <button key={path.id} onClick={() => handleRoleChoose(path.id as LearningRole)}
            className="w-full text-left p-4 rounded-xl bg-white/10 hover:bg-white/18
              border border-white/10 hover:border-[#F7B731]/40 transition-all group">
            <p className="font-display font-bold text-white text-lg group-hover:text-[#F7B731] transition-colors">{path.label}</p>
            <p className="text-white/55 text-sm mt-0.5">{path.focus}</p>
          </button>
        ))}
      </div>
      <button onClick={() => setRolePickerDismissed(true)}
        className="mt-5 text-white/35 text-xs hover:text-white/60 transition-colors">
        Skip for now
      </button>
    </div>
  )

  // ── Lesson content: video → quiz → sandbox → next, or task checklist for mod-00 ──
  const lessonContent = (() => {
    if (!activeModule) return null

    if (!canWatchModule(activeModule.id)) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white/40" />
          </div>
          <h4 className="font-display font-bold text-white text-xl mb-2">This module is locked</h4>
          <p className="text-white/50 text-sm max-w-sm mb-2">
            You've completed the free preview. Create a free account to unlock all {modules.length} modules.
          </p>
          <p className="text-white/30 text-xs mb-6">No credit card required.</p>
          <button onClick={() => openAuthModal('register')}
            className="bg-rose-punch text-white font-display font-semibold px-6 py-3 rounded-xl
              hover:bg-[#ff3d5d] transition-all flex items-center gap-2">
            Join Free — it takes 30 seconds <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )
    }

    if (isLoadingLessons) {
      return <p className="text-white/50 text-sm">Loading lessons…</p>
    }
    if (!currentLesson) {
      return <p className="text-white/50 text-sm">No lessons configured for this module yet.</p>
    }

    const isLessonDone = completedLessonIds.includes(currentLesson.id)

    return (
      <div>
        {/* Lesson progress dots for this module */}
        {lessons.length > 1 && (
          <div className="flex items-center gap-1.5 mb-4">
            {lessons.map((l, i) => (
              <button key={l.id} onClick={() => goToLesson(i)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  completedLessonIds.includes(l.id) ? 'bg-[#3CCF4A]'
                  : i === activeLessonIndex ? 'bg-[#F7B731]' : 'bg-white/15'
                }`} />
            ))}
          </div>
        )}
        <p className="text-white/40 text-xs font-accent uppercase tracking-wider mb-4">
          Lesson {activeLessonIndex + 1} of {lessons.length} · Module {activeModule.num}: {activeModule.title}
        </p>

        {currentLesson.type === 'task' ? (
          <div>
            <h4 className="font-display font-bold text-white text-xl mb-2">{currentLesson.title}</h4>
            <ul className="space-y-2 mb-5">
              {currentLesson.checklist?.map((item, i) => (
                <li key={i} className="flex gap-2 text-white/75 text-sm">
                  <span className="text-[#F7B731] flex-shrink-0">{i + 1}.</span> {item}
                </li>
              ))}
            </ul>
            {currentLesson.externalUrl && (
              <a href={currentLesson.externalUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-[#F7B731] text-sm mb-5 hover:underline">
                Open GitHub signup <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button onClick={finishLesson} disabled={isLessonDone}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all
                ${isLessonDone ? 'bg-[#3CCF4A]/20 text-[#3CCF4A]' : 'bg-rose-punch text-white hover:bg-[#ff3d5d]'}`}>
              <CheckCircle2 className="w-4 h-4" />
              {isLessonDone ? 'Completed' : isLoggedIn ? 'Mark lesson complete' : 'Mark as done (this browser only)'}
            </button>
            {!isLoggedIn && !isLessonDone && (
              <p className="text-white/35 text-xs mt-2">
                Join free afterward — the rest of the course syncs to your account automatically.
              </p>
            )}
          </div>
        ) : lessonStep === 'video' ? (
          <LessonPlayer
            lesson={currentLesson}
            onContinue={() =>
              setLessonStep(currentLesson.quiz ? 'quiz' : currentLesson.sandbox ? 'sandbox' : 'recap')
            }
          />
        ) : lessonStep === 'quiz' && currentLesson.quiz ? (
          <QuizStep
            questions={currentLesson.quiz}
            onComplete={() => (currentLesson.sandbox ? setLessonStep('sandbox') : finishLesson())}
          />
        ) : lessonStep === 'sandbox' && currentLesson.sandbox ? (
          <GitSandbox task={currentLesson.sandbox} onSolved={finishLesson} />
        ) : (
          <div>
            <h4 className="font-display font-bold text-white text-xl mb-3">{currentLesson.title}</h4>
            <p className="text-white/60 text-sm mb-5">
              {isLessonDone ? "You've completed this lesson." : "No sandbox for this one — you're all set."}
            </p>
            {!isLessonDone && (
              <button onClick={finishLesson}
                className="bg-rose-punch text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-all">
                Mark lesson complete
              </button>
            )}
          </div>
        )}

        {showGitterRequiredNotice && activeModule.id === GITTER_GATE_MODULE && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F7B731]/15 border border-[#F7B731]/30 px-4 py-3">
            <Sparkles className="w-4 h-4 text-[#F7B731] flex-shrink-0 mt-0.5" />
            <p className="text-white/80 text-sm">
              Activate Gitter AI first — open the Gitter chat in the bottom-right corner and add a free API key.
              This is required before completing Module 1, so every reviewer's feedback gets AI-checked.
            </p>
          </div>
        )}
      </div>
    )
  })()

  // ── Sidebar ──
  const sidebarContent = (
    <div className="p-3">
      <p className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/40 px-3 mb-2">All Modules</p>
      {modules.map(mod => {
        const isActive = mod.id === activeModuleId
        const isDone = completedModules.includes(mod.id)
        const isNextUp = mod.id === nextIncompleteModule?.id
        const isLocked = !canWatchModule(mod.id)
        const moduleLessons = getLessonsForModule(mod.id)

        return (
          <div key={mod.id} className="mb-1">
            <button onClick={() => handleModuleSelect(mod.id)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3
                ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${isDone ? 'bg-[#3CCF4A]' : isActive ? 'bg-[#F7B731]' : 'bg-white/10'}`}>
                {isDone ? <Check className="w-3.5 h-3.5 text-white" />
                  : isLocked ? <Lock className="w-3 h-3 text-white/30" />
                  : <span className="text-white/60 text-[10px] font-display font-bold">{mod.num}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : isLocked ? 'text-white/35' : 'text-white/70'}`}>
                    {mod.title}
                  </p>
                  {isNextUp && !isActive && !isLocked && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-accent font-semibold uppercase tracking-wider bg-[#F7B731]/20 text-[#F7B731]">
                      Next
                    </span>
                  )}
                  {!isLoggedIn && mod.id === GUEST_PREVIEW_MODULE && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-accent font-semibold uppercase tracking-wider bg-[#3CCF4A]/20 text-[#3CCF4A]">
                      Free
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isLocked ? 'text-white/25' : 'text-white/40'}`}>{mod.duration} | {mod.channel}</p>
              </div>
            </button>

            {/* Lesson sub-list — only shown for the active, unlocked module */}
            {isActive && !isLocked && moduleLessons.length > 1 && (
              <div className="ml-9 mt-1 mb-2 space-y-0.5">
                {moduleLessons.map((l, i) => (
                  <button key={l.id} onClick={() => goToLesson(i)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors
                      ${i === activeLessonIndex ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70 hover:bg-white/5'}`}>
                    {completedLessonIds.includes(l.id)
                      ? <Check className="w-3 h-3 text-[#3CCF4A] flex-shrink-0" />
                      : <span className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate">{l.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const mainContent = shouldShowRolePicker ? rolePicker : lessonContent

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCurriculum} />
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-[#4A2F2F] card-shadow flex flex-col animate-[slideInRight_0.3s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-[#F7B731]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Course Curriculum</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-white/50 text-xs font-accent uppercase tracking-wider">
                  {completedModules.length} / {modules.length} completed
                </p>
                <span className="text-white/20 text-xs">·</span>
                <div className="flex items-center gap-1 text-white/40 text-xs">
                  <Clock className="w-3 h-3" />{TOTAL_HOURS} total
                </div>
              </div>
            </div>
          </div>
          <button onClick={closeCurriculum} className="text-white/50 hover:text-white transition-colors p-2" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 md:px-6 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#F7B731] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="font-display font-semibold text-white text-sm">{progressPercent}%</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
            <Route className="h-3.5 w-3.5 text-[#F7B731]" />
            <span className="font-accent uppercase tracking-[0.12em]">{rolePath.label}</span>
            <span className="truncate">{rolePath.focus}</span>
          </div>
        </div>

        {/* Review gate banner */}
        {isAllDone && !hasSubmittedReview && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-[#F7B731]/15 border-b border-[#F7B731]/30">
            <div className="flex items-center gap-2 min-w-0">
              <Star className="w-4 h-4 text-[#F7B731] flex-shrink-0" />
              <p className="text-white text-sm font-medium">All done! Leave a quick review to earn your certificate.</p>
            </div>
            <button onClick={openReviewModal}
              className="flex-shrink-0 flex items-center gap-1.5 bg-[#F7B731] text-[#2A2A2A] font-display font-semibold text-xs px-3 py-2 rounded-lg hover:bg-[#f0ad28] transition-colors">
              Review <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {isCourseComplete && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 bg-[#3CCF4A]/15 border-b border-[#3CCF4A]/30">
            <Award className="w-4 h-4 text-[#3CCF4A]" />
            <p className="text-[#3CCF4A] text-sm font-semibold">Course complete — well done!</p>
          </div>
        )}

        {/* Mobile tabs */}
        <div className="md:hidden flex border-b border-white/10 flex-shrink-0">
          <button onClick={() => setMobileTab('watch')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-display font-semibold transition-colors
              ${mobileTab === 'watch' ? 'text-white border-b-2 border-[#F7B731]' : 'text-white/50'}`}>
            <Play className="w-4 h-4" /> Watch
          </button>
          <button onClick={() => setMobileTab('modules')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-display font-semibold transition-colors
              ${mobileTab === 'modules' ? 'text-white border-b-2 border-[#F7B731]' : 'text-white/50'}`}>
            <List className="w-4 h-4" /> Modules
            {nextIncompleteModule && <span className="w-2 h-2 rounded-full bg-[#F7B731] flex-shrink-0" />}
          </button>
        </div>

        {/* Mobile content */}
        <div className="md:hidden flex-1 overflow-y-auto min-h-0">
          {mobileTab === 'watch' ? <div className="p-4">{mainContent}</div> : sidebarContent}
        </div>

        {/* Desktop side-by-side */}
        <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
          <div className="flex-1 p-6 overflow-y-auto">{mainContent}</div>
          <div className="w-72 border-l border-white/10 overflow-y-auto flex-shrink-0">{sidebarContent}</div>
        </div>
      </div>
    </div>
  )
}
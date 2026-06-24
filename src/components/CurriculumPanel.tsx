/**
 * CurriculumPanel.tsx
 *
 * Changes in this version:
 * 1. Guest preview: mod-01 video is freely watchable without login.
 *    Modules 2–8 show a lock and prompt registration.
 * 2. "Start Here" role question: first-time visitors (no role chosen yet,
 *    no modules completed) see a single-question interstitial before the
 *    video, asking "What describes you best?" Choosing a role dismisses it
 *    and sets their learning path immediately.
 * 3. Time estimate in header: shows total course hours so learners can plan.
 * 4. Mobile tab switcher: Watch / Modules tabs on small screens.
 * 5. Auto-advance after marking complete.
 * 6. "Next" badge on sidebar for recommended next module.
 * 7. Review gate banner at 100%.
 */

import { useState } from 'react'
import { useApp, ROLE_PATHS, type LearningRole } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { X, Check, Play, Lock, Star, Award, ChevronRight, Route, List, Clock } from 'lucide-react'

// mod-01 is the free preview module — no login required to watch
const FREE_PREVIEW_MODULE = 'mod-01'

// Total course time shown in the header
const TOTAL_HOURS = '~7 hrs'

export default function CurriculumPanel() {
  const {
    isCurriculumOpen,
    closeCurriculum,
    activeModuleId,
    setActiveModule,
    modules,
    completedModules,
    toggleModuleComplete,
    isCourseComplete,
    openReviewModal,
    hasSubmittedReview,
    rolePath,
    role,
    setRole,
  } = useApp()

  const { isLoggedIn, openAuthModal } = useAuth()

  const [mobileTab, setMobileTab] = useState<'watch' | 'modules'>('watch')
  // Show role picker if user hasn't picked a role and hasn't completed anything
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [rolePickerDismissed, setRolePickerDismissed] = useState(false)

  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0]
  const progressPercent = Math.round((completedModules.length / modules.length) * 100)
  const isAllDone = completedModules.length === modules.length
  const nextIncompleteModule = modules.find(m => !completedModules.includes(m.id))

  // Show role picker on first open if they have no completions and haven't dismissed it
  const shouldShowRolePicker =
    !rolePickerDismissed &&
    completedModules.length === 0 &&
    !isLoggedIn === false // only show to logged-in users; guests get it after registering

  // A module is watchable if: user is logged in OR it's the free preview module
  const canWatchModule = (moduleId: string) =>
    isLoggedIn || moduleId === FREE_PREVIEW_MODULE

  const handleToggleComplete = (id: string) => {
    if (!isLoggedIn) return
    const wasComplete = completedModules.includes(id)
    toggleModuleComplete(id)
    if (!wasComplete) {
      const currentIndex = modules.findIndex(m => m.id === id)
      const nextModule = modules.slice(currentIndex + 1).find(
        m => !completedModules.includes(m.id) && m.id !== id
      )
      if (nextModule) {
        setTimeout(() => setActiveModule(nextModule.id), 400)
      }
    }
  }

  const handleModuleSelect = (id: string) => {
    setActiveModule(id)
    setMobileTab('watch')
  }

  const handleRoleChoose = (chosenRole: LearningRole) => {
    setRole(chosenRole)
    setRolePickerDismissed(true)
    setShowRolePicker(false)
  }

  if (!isCurriculumOpen) return null

  // ── Role picker interstitial ──
  const rolePicker = (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center px-6 py-8">
      <div className="w-14 h-14 rounded-full bg-[#F7B731]/20 flex items-center justify-center mb-4">
        <Route className="w-7 h-7 text-[#F7B731]" />
      </div>
      <h4 className="font-display font-bold text-white text-2xl mb-2">
        What describes you best?
      </h4>
      <p className="text-white/55 text-sm mb-8 max-w-sm">
        We'll personalise the module order and tips to match your goals.
        You can change this any time in your dashboard.
      </p>
      <div className="w-full max-w-sm space-y-3">
        {ROLE_PATHS.map(path => (
          <button
            key={path.id}
            onClick={() => handleRoleChoose(path.id)}
            className="w-full text-left p-4 rounded-xl bg-white/10 hover:bg-white/18
              border border-white/10 hover:border-[#F7B731]/40 transition-all group"
          >
            <p className="font-display font-bold text-white text-lg group-hover:text-[#F7B731] transition-colors">
              {path.label}
            </p>
            <p className="text-white/55 text-sm mt-0.5">{path.focus}</p>
          </button>
        ))}
      </div>
      <button
        onClick={() => setRolePickerDismissed(true)}
        className="mt-5 text-white/35 text-xs hover:text-white/60 transition-colors"
      >
        Skip for now
      </button>
    </div>
  )

  // ── Video / login content ──
  const videoContent = (
    <>
      {canWatchModule(activeModule.id) ? (
        <>
          {/* Free preview badge for guests */}
          {!isLoggedIn && activeModule.id === FREE_PREVIEW_MODULE && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[#3CCF4A]/15 border border-[#3CCF4A]/30">
              <span className="text-[#3CCF4A] text-xs font-display font-semibold">Free preview</span>
              <span className="text-white/50 text-xs">— register to unlock all 8 modules</span>
            </div>
          )}

          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${activeModule.youtubeId}?rel=0`}
              title={activeModule.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-[#F7B731] text-[#2A2A2A]">
                {activeModule.difficulty}
              </span>
              <span className="text-white/40 text-xs">{activeModule.duration}</span>
              <span className="text-white/40 text-xs">| {activeModule.channel}</span>
            </div>
            <h4 className="font-display font-bold text-white text-xl mb-2">
              Module {activeModule.num}: {activeModule.title}
            </h4>
            <p className="text-white/70 text-sm leading-relaxed">{activeModule.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {activeModule.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-white/10 text-white/60">
                #{tag}
              </span>
            ))}
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => handleToggleComplete(activeModule.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all
                ${completedModules.includes(activeModule.id)
                  ? 'bg-[#3CCF4A]/20 text-[#3CCF4A]'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              <Check className={`w-4 h-4 ${completedModules.includes(activeModule.id) ? '' : 'opacity-50'}`} />
              {completedModules.includes(activeModule.id) ? 'Completed — tap to undo' : 'Mark as Complete'}
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('register')}
              className="flex items-center gap-2 bg-rose-punch text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-all"
            >
              Join Free to Track Progress <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      ) : (
        /* Locked module — guest trying to access mod-02+ */
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white/40" />
          </div>
          <h4 className="font-display font-bold text-white text-xl mb-2">
            This module is locked
          </h4>
          <p className="text-white/50 text-sm max-w-sm mb-2">
            You've watched the free preview. Create a free account to unlock all {modules.length} modules and track your progress.
          </p>
          <p className="text-white/30 text-xs mb-6">No credit card required.</p>
          <button
            onClick={() => openAuthModal('register')}
            className="bg-rose-punch text-white font-display font-semibold px-6 py-3 rounded-xl
              hover:bg-[#ff3d5d] transition-all flex items-center gap-2"
          >
            Join Free — it takes 30 seconds <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )

  // ── Sidebar module list ──
  const sidebarContent = (
    <div className="p-3">
      <p className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/40 px-3 mb-2">
        All Modules
      </p>
      {modules.map(mod => {
        const isActive = mod.id === activeModuleId
        const isDone = completedModules.includes(mod.id)
        const isNextUp = mod.id === nextIncompleteModule?.id
        const isLocked = !canWatchModule(mod.id)

        return (
          <button
            key={mod.id}
            onClick={() => handleModuleSelect(mod.id)}
            className={`w-full text-left p-3 rounded-xl mb-1 transition-all flex items-start gap-3
              ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
              ${isDone ? 'bg-[#3CCF4A]' : isActive ? 'bg-[#F7B731]' : 'bg-white/10'}`}>
              {isDone
                ? <Check className="w-3.5 h-3.5 text-white" />
                : isLocked
                  ? <Lock className="w-3 h-3 text-white/30" />
                  : <span className="text-white/60 text-[10px] font-display font-bold">{mod.num}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : isLocked ? 'text-white/35' : 'text-white/70'}`}>
                  {mod.title}
                </p>
                {isNextUp && !isActive && !isLocked && (
                  <span className="inline-block flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px]
                    font-accent font-semibold uppercase tracking-wider bg-[#F7B731]/20 text-[#F7B731]">
                    Next
                  </span>
                )}
                {!isLoggedIn && mod.id === FREE_PREVIEW_MODULE && (
                  <span className="inline-block flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px]
                    font-accent font-semibold uppercase tracking-wider bg-[#3CCF4A]/20 text-[#3CCF4A]">
                    Free
                  </span>
                )}
              </div>
              <p className={`text-xs ${isLocked ? 'text-white/25' : 'text-white/40'}`}>
                {mod.duration} | {mod.channel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCurriculum} />

      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-[#4A2F2F] card-shadow
        flex flex-col animate-[slideInRight_0.3s_ease-out]">

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
                  <Clock className="w-3 h-3" />
                  {TOTAL_HOURS} total
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
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 md:px-6 py-3
            bg-[#F7B731]/15 border-b border-[#F7B731]/30">
            <div className="flex items-center gap-2 min-w-0">
              <Star className="w-4 h-4 text-[#F7B731] flex-shrink-0" />
              <p className="text-white text-sm font-medium leading-snug">
                All done! Leave a quick review to earn your certificate.
              </p>
            </div>
            <button
              onClick={openReviewModal}
              className="flex-shrink-0 flex items-center gap-1.5 bg-[#F7B731] text-[#2A2A2A]
                font-display font-semibold text-xs px-3 py-2 rounded-lg hover:bg-[#f0ad28] transition-colors"
            >
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

        {/* Mobile tab bar */}
        <div className="md:hidden flex border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setMobileTab('watch')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-display font-semibold transition-colors
              ${mobileTab === 'watch' ? 'text-white border-b-2 border-[#F7B731]' : 'text-white/50'}`}
          >
            <Play className="w-4 h-4" /> Watch
          </button>
          <button
            onClick={() => setMobileTab('modules')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-display font-semibold transition-colors
              ${mobileTab === 'modules' ? 'text-white border-b-2 border-[#F7B731]' : 'text-white/50'}`}
          >
            <List className="w-4 h-4" /> Modules
            {nextIncompleteModule && <span className="w-2 h-2 rounded-full bg-[#F7B731] flex-shrink-0" />}
          </button>
        </div>

        {/* Mobile content */}
        <div className="md:hidden flex-1 overflow-y-auto min-h-0">
          {mobileTab === 'watch'
            ? <div className="p-4">{shouldShowRolePicker && !rolePickerDismissed ? rolePicker : videoContent}</div>
            : sidebarContent
          }
        </div>

        {/* Desktop side-by-side */}
        <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
          <div className="flex-1 p-6 overflow-y-auto">
            {shouldShowRolePicker && !rolePickerDismissed ? rolePicker : videoContent}
          </div>
          <div className="w-72 border-l border-white/10 overflow-y-auto flex-shrink-0">
            {sidebarContent}
          </div>
        </div>
      </div>
    </div>
  )
}

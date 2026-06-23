/**
 * ============================================================================
 * CurriculumPanel.tsx
 * ============================================================================
 *
 * Slide-out curriculum panel with video player and module sidebar.
 *
 * Improvements:
 * - Auto-advance: after marking a module complete, automatically opens
 *   the next incomplete module so the user never has to hunt for it
 * - Next-up highlight: the sidebar shows a "Next" badge on the first
 *   incomplete module in the user's role-path order
 * - Mobile sidebar: uses `100dvh` instead of `calc(100vh - 140px)` so
 *   modules are never cut off on short screens
 * - Review gate: a persistent banner appears once progress hits 100%,
 *   making it impossible to miss the final review step
 * ============================================================================
 */

import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { X, Check, Play, Lock, Star, Award, ChevronRight, Route } from 'lucide-react'

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
  } = useApp()

  const { isLoggedIn, openAuthModal } = useAuth()

  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0]
  const progressPercent = Math.round((completedModules.length / modules.length) * 100)
  const isAllDone = completedModules.length === modules.length

  // The first module the user hasn't completed yet (role-path order)
  const nextIncompleteModule = modules.find(m => !completedModules.includes(m.id))

  /** Mark complete and auto-advance to the next incomplete module */
  const handleToggleComplete = (id: string) => {
    const wasComplete = completedModules.includes(id)
    toggleModuleComplete(id)

    // Only auto-advance when marking as complete (not when un-marking)
    if (!wasComplete) {
      const currentIndex = modules.findIndex(m => m.id === id)
      const nextModule = modules.slice(currentIndex + 1).find(m => !completedModules.includes(m.id) && m.id !== id)
      if (nextModule) {
        // Small delay so the checkmark animation is visible first
        setTimeout(() => setActiveModule(nextModule.id), 400)
      }
    }
  }

  if (!isCurriculumOpen) return null

  return (
    <div className="fixed inset-0 z-[150]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCurriculum}
      />

      {/* Panel */}
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
              <p className="text-white/50 text-xs font-accent uppercase tracking-wider">
                {completedModules.length} / {modules.length} completed
              </p>
            </div>
          </div>
          <button
            onClick={closeCurriculum}
            className="text-white/50 hover:text-white transition-colors p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 md:px-6 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F7B731] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-display font-semibold text-white text-sm">{progressPercent}%</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
            <Route className="h-4 w-4 text-[#F7B731]" />
            <span className="font-accent uppercase tracking-[0.12em]">{rolePath.label}</span>
            <span>{rolePath.focus}</span>
          </div>
        </div>

        {/* Review gate banner — shown prominently once all modules are done */}
        {isAllDone && !hasSubmittedReview && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 md:px-6 py-3
            bg-[#F7B731]/15 border-b border-[#F7B731]/30">
            <div className="flex items-center gap-2 min-w-0">
              <Star className="w-4 h-4 text-[#F7B731] flex-shrink-0" />
              <p className="text-white text-sm font-medium leading-snug">
                You've finished all modules! Leave a review to complete the course and earn your certificate.
              </p>
            </div>
            <button
              onClick={openReviewModal}
              className="flex-shrink-0 flex items-center gap-1.5 bg-[#F7B731] text-[#2A2A2A]
                font-display font-semibold text-xs px-3 py-2 rounded-lg hover:bg-[#f0ad28] transition-colors"
            >
              Review
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Course complete banner */}
        {isCourseComplete && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3
            bg-[#3CCF4A]/15 border-b border-[#3CCF4A]/30">
            <Award className="w-4 h-4 text-[#3CCF4A]" />
            <p className="text-[#3CCF4A] text-sm font-semibold">Course complete — well done!</p>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

          {/* Video + info area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {isLoggedIn ? (
              <>
                {/* YouTube embed */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeModule.youtubeId}?rel=0`}
                    title={activeModule.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Module meta */}
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
                  <p className="text-white/70 text-sm leading-relaxed">
                    {activeModule.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {activeModule.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-white/10 text-white/60">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Mark complete */}
                <button
                  onClick={() => handleToggleComplete(activeModule.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all
                    ${completedModules.includes(activeModule.id)
                      ? 'bg-[#3CCF4A]/20 text-[#3CCF4A]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  <Check className={`w-4 h-4 ${completedModules.includes(activeModule.id) ? '' : 'opacity-50'}`} />
                  {completedModules.includes(activeModule.id) ? 'Completed — click to undo' : 'Mark as Complete'}
                </button>
              </>
            ) : (
              /* Login prompt */
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-white/40" />
                </div>
                <h4 className="font-display font-bold text-white text-xl mb-2">
                  Login to Access Lessons
                </h4>
                <p className="text-white/50 text-sm max-w-sm mb-6">
                  Create a free account to unlock all {modules.length} video modules and track your progress.
                </p>
                <button
                  onClick={() => openAuthModal('register')}
                  className="bg-rose-punch text-white font-display font-semibold px-6 py-3 rounded-xl
                    hover:bg-[#ff3d5d] transition-all flex items-center gap-2"
                >
                  Join Free <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Module sidebar */}
          <div
            className="w-full md:w-72 border-t md:border-t-0 md:border-l border-white/10 overflow-y-auto flex-shrink-0
              max-h-[300px] md:max-h-[100dvh]"
          >
            <div className="p-3">
              <p className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/40 px-3 mb-2">
                All Modules
              </p>
              {modules.map(mod => {
                const isActive = mod.id === activeModuleId
                const isDone = completedModules.includes(mod.id)
                const isNextUp = mod.id === nextIncompleteModule?.id

                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={`w-full text-left p-3 rounded-xl mb-1 transition-all flex items-start gap-3
                      ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    {/* Completion indicator */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isDone ? 'bg-[#3CCF4A]' : isActive ? 'bg-[#F7B731]' : 'bg-white/10'}`}>
                      {isDone ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="text-white/60 text-[10px] font-display font-bold">{mod.num}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {mod.title}
                        </p>
                        {/* "Next" badge — highlights the recommended next step */}
                        {isNextUp && !isActive && (
                          <span className="inline-block flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px]
                            font-accent font-semibold uppercase tracking-wider bg-[#F7B731]/20 text-[#F7B731]">
                            Next
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs">{mod.duration} | {mod.channel}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

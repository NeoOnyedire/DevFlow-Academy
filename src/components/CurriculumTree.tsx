/**
 * CurriculumTree.tsx
 *
 * The curriculum "work tree" — a slide-over nav panel listing every module
 * and, for the active module, its lessons. Pure navigation: every click
 * pushes a URL and closes the tree. It holds no lesson-flow state — that
 * now lives on the route itself (see LessonContent.tsx / LearnPage.tsx).
 *
 * THEME: the panel reads the --tree-* variables from index.css via the
 * tree-* classes (Original = brown panel, Light = white panel, Dark = dark
 * panel). It deliberately avoids text-white / bg-white/NN and bg-[#4A2F2F],
 * which the global theme overrides remap in ways that broke this panel.
 *
 * LINT FIX (react-hooks/set-state-in-effect): the effect used to call
 * setCompletedLessonIds([]) when no module was active. The completed ids
 * are now stored with the key they were fetched for and derived at render
 * time, so the effect only sets state from the promise callback.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Lock, GitBranch } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getLessonsForModule } from '../content/lessons'
import { fetchCompletedLessonIds } from '../lib/lessonProgress'

const GUEST_PREVIEW_MODULE = 'mod-00'
const GUEST_TASK_STORAGE = 'devflow_guest_task_lessons'

function loadGuestTaskIds(): string[] {
  try {
    const saved = localStorage.getItem(GUEST_TASK_STORAGE)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  activeModuleId: string | null
  activeLessonId: string | null
}

export default function CurriculumTree({ isOpen, onClose, activeModuleId, activeLessonId }: Props) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { modules, completedModules } = useApp()

  const loadKey = `${activeModuleId ?? ''}:${isLoggedIn ? 'user' : 'guest'}`
  const [loaded, setLoaded] = useState<{ key: string; ids: string[] } | null>(null)
  const completedLessonIds = activeModuleId && loaded?.key === loadKey ? loaded.ids : []

  const canWatchModule = (id: string) => isLoggedIn || id === GUEST_PREVIEW_MODULE

  useEffect(() => {
    if (!activeModuleId) return
    let cancelled = false
    const idsPromise = isLoggedIn
      ? fetchCompletedLessonIds(activeModuleId)
      : Promise.resolve(loadGuestTaskIds())
    idsPromise.then(ids => {
      if (!cancelled) setLoaded({ key: loadKey, ids })
    })
    return () => { cancelled = true }
  }, [activeModuleId, isLoggedIn, loadKey])

  const go = (moduleId: string, lessonId?: string) => {
    navigate(lessonId ? `/learn/${moduleId}/${lessonId}` : `/learn/${moduleId}`)
    onClose()
  }

  const progressPercent = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[190] bg-black/50 backdrop-blur-sm" onClick={onClose} />}
      <div
        className={`tree-panel fixed top-0 right-0 z-[195] h-full w-full max-w-sm card-shadow flex flex-col
          transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{ borderLeft: '1px solid var(--tree-border)' }}
      >
        <div className="tree-border flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#F7B731]" />
            <div>
              <p className="font-display font-bold text-sm tree-text">Work Tree</p>
              <p className="text-xs tree-faint">{completedModules.length}/{modules.length} · {progressPercent}%</p>
            </div>
          </div>
          <button onClick={onClose} className="tree-faint hover:opacity-70 transition-opacity p-1.5" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {modules.map(mod => {
            const isActive = mod.id === activeModuleId
            const isDone = completedModules.includes(mod.id)
            const isLocked = !canWatchModule(mod.id)
            const moduleLessons = isActive ? getLessonsForModule(mod.id) : []

            return (
              <div key={mod.id} className="mb-1">
                <button
                  onClick={() => !isLocked && go(mod.id)}
                  disabled={isLocked}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 tree-hover
                    ${isActive ? 'tree-active' : ''} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${isDone ? 'bg-[#3CCF4A]' : isActive ? 'bg-[#F7B731]' : 'tree-chip'}`}>
                    {isDone ? <Check className="w-3.5 h-3.5 text-[#ffffff]" />
                      : isLocked ? <Lock className="w-3 h-3 tree-faint" />
                      : <span className={`text-[10px] font-display font-bold ${isActive ? 'text-[#2A2A2A]' : 'tree-soft'}`}>{mod.num}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isActive ? 'tree-text' : isLocked ? 'tree-faint' : 'tree-soft'}`}>
                      {mod.title}
                    </p>
                    <p className="text-xs tree-faint">{mod.duration} · {mod.channel}</p>
                  </div>
                </button>

                {isActive && moduleLessons.length > 1 && (
                  <div className="tree-border ml-9 mt-1 mb-2 space-y-0.5 border-l pl-3">
                    {moduleLessons.map(l => (
                      <button key={l.id} onClick={() => go(mod.id, l.id)}
                        className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors tree-hover
                          ${l.id === activeLessonId ? 'tree-active tree-text' : 'tree-soft'}`}>
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
      </div>
    </>
  )
}

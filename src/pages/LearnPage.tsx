/**
 * LearnPage.tsx — /learn, /learn/:moduleId, /learn/:moduleId/:lessonId
 *
 * The real curriculum page. No moduleId -> role picker (first-time users)
 * or a module grid. moduleId with no lessonId -> resolves to the first
 * incomplete lesson and replaces the URL. moduleId + lessonId -> renders
 * LessonContent. The CurriculumTree slides over the top as navigation —
 * it holds no lesson-flow state of its own.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import { useApp, ROLE_PATHS, type LearningRole } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getLessonsForModule } from '../content/lessons'
import { fetchCompletedLessonIds } from '../lib/lessonProgress'
import CurriculumTree from '../components/Curriculum/CurriculumTree'
import LessonContent from '../components/Curriculum/LessonContent'
import { Route as RouteIcon, PanelRightOpen, Lock, ChevronRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

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

export default function LearnPage() {
  const { moduleId, lessonId } = useParams<{ moduleId?: string; lessonId?: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, openAuthModal } = useAuth()
  const { modules, completedModules, rolePath, setRole } = useApp()

  const [isTreeOpen, setIsTreeOpen] = useState(false)
  const [rolePickerDismissed, setRolePickerDismissed] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [moduleId, lessonId])

  const activeModule = modules.find(m => m.id === moduleId)
  const lessons = activeModule ? getLessonsForModule(activeModule.id) : []
  const canWatchModule = (id: string) => isLoggedIn || id === GUEST_PREVIEW_MODULE

  // Bare /learn/:moduleId -> resolve to the first incomplete lesson.
  useEffect(() => {
    if (!activeModule || lessonId) return
    if (!canWatchModule(activeModule.id)) return // locked screen handles this

    let cancelled = false
    const resolve = async () => {
      const moduleLessons = getLessonsForModule(activeModule.id)
      if (moduleLessons.length === 0) return
      const ids = isLoggedIn ? await fetchCompletedLessonIds(activeModule.id) : loadGuestTaskIds()
      if (cancelled) return
      const firstIncomplete = moduleLessons.findIndex(l => !ids.includes(l.id))
      const target = moduleLessons[firstIncomplete === -1 ? 0 : firstIncomplete]
      navigate(`/learn/${activeModule.id}/${target.id}`, { replace: true })
    }
    resolve()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule?.id, lessonId, isLoggedIn])

  const shouldShowRolePicker = isLoggedIn && !rolePickerDismissed && completedModules.length === 0 && !moduleId

  const handleRoleChoose = (chosenRole: LearningRole) => {
    setRole(chosenRole)
    setRolePickerDismissed(true)
  }

  return (
    <PageWrapper bg="bg-sun-yellow">
      <section className="relative px-[6vw] py-10 md:py-14 min-h-screen">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="font-accent text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-on-accent-soft)' }}>
              {rolePath.label} · {completedModules.length}/{modules.length} modules
            </p>
            <h1 className="font-display font-bold tracking-[0.02em] leading-none mt-1"
              style={{ fontSize: 'clamp(30px, 4.5vw, 56px)', color: 'var(--text-on-accent)' }}>
              Curriculum
            </h1>
          </div>
          <button
            onClick={() => setIsTreeOpen(true)}
            className="flex items-center gap-2 bg-[#2A2A2A] text-white font-display font-semibold px-4 py-2.5 rounded-xl hover:scale-105 transition-transform flex-shrink-0"
          >
            <PanelRightOpen className="w-4 h-4" /> <span className="hidden sm:inline">Work tree</span>
          </button>
        </div>

        {!activeModule && (
          shouldShowRolePicker ? (
            <RolePicker onChoose={handleRoleChoose} onSkip={() => setRolePickerDismissed(true)} />
          ) : (
            <ModuleGrid modules={modules} completedModules={completedModules} onSelect={id => navigate(`/learn/${id}`)} />
          )
        )}

        {activeModule && !canWatchModule(activeModule.id) && (
          <div className="flex flex-col items-center justify-center text-center py-24 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" style={{ color: 'var(--text-on-accent-soft)' }} />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-on-accent)' }}>
              This module is locked
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-on-accent-soft)' }}>
              You've completed the free preview. Create a free account to unlock all {modules.length} modules.
            </p>
            <button onClick={() => openAuthModal('register')}
              className="bg-rose-punch text-white font-display font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-all flex items-center gap-2">
              Join Free — it takes 30 seconds <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeModule && canWatchModule(activeModule.id) && lessonId && (
          <LessonContent
            module={activeModule}
            lessons={lessons}
            lessonId={lessonId}
            onAdvance={(nextLessonId, moduleCompleted) => {
              if (nextLessonId) { navigate(`/learn/${activeModule.id}/${nextLessonId}`); return }
              if (moduleCompleted) {
                const next = modules.find(m => !completedModules.includes(m.id) && m.id !== activeModule.id)
                if (next) { navigate(`/learn/${next.id}`); return }
              }
              navigate('/learn')
            }}
          />
        )}

        <CurriculumTree
          isOpen={isTreeOpen}
          onClose={() => setIsTreeOpen(false)}
          activeModuleId={activeModule?.id ?? null}
          activeLessonId={lessonId ?? null}
        />
      </section>
    </PageWrapper>
  )
}

function RolePicker({ onChoose, onSkip }: { onChoose: (r: LearningRole) => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto py-16">
      <div className="w-14 h-14 rounded-full bg-black/10 flex items-center justify-center mb-4">
        <RouteIcon className="w-7 h-7" style={{ color: 'var(--text-on-accent)' }} />
      </div>
      <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-on-accent)' }}>
        What describes you best?
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-on-accent-soft)' }}>
        We'll personalise the module order and tips to match your goals. You can change this any time.
      </p>
      <div className="w-full space-y-3">
        {ROLE_PATHS.map(path => (
          <button key={path.id} onClick={() => onChoose(path.id as LearningRole)}
            className="w-full text-left p-4 rounded-xl bg-white/60 hover:bg-white/80 border border-black/10 transition-all">
            <p className="font-display font-bold text-[#2A2A2A] text-lg">{path.label}</p>
            <p className="text-[#2A2A2A]/60 text-sm mt-0.5">{path.focus}</p>
          </button>
        ))}
      </div>
      <button onClick={onSkip} className="mt-5 text-xs hover:opacity-70 transition-opacity" style={{ color: 'var(--text-on-accent-soft)' }}>
        Skip for now
      </button>
    </div>
  )
}

interface ModuleLike {
  id: string
  num: string
  title: string
  description: string
  duration: string
  difficulty: string
}

function ModuleGrid({ modules, completedModules, onSelect }: {
  modules: ModuleLike[]
  completedModules: string[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map(mod => {
        const isDone = completedModules.includes(mod.id)
        return (
          <button key={mod.id} onClick={() => onSelect(mod.id)}
            className="text-left bg-white/60 hover:bg-white/80 border border-black/10 rounded-2xl p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-bold text-[#2A2A2A]/40 text-sm">{mod.num}</span>
              {isDone && (
                <span className="text-[10px] font-accent uppercase tracking-wider bg-[#3CCF4A]/20 text-[#2FAE3C] px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-[#2A2A2A] text-lg mb-1">{mod.title}</h3>
            <p className="text-[#2A2A2A]/60 text-sm line-clamp-2">{mod.description}</p>
            <p className="text-[#2A2A2A]/40 text-xs mt-3">{mod.duration} · {mod.difficulty}</p>
          </button>
        )
      })}
    </div>
  )
}
/**
 * LessonContent.tsx
 *
 * Renders one lesson's flow (video -> quiz -> sandbox, or the mod-00 task
 * checklist) and reports completion via onAdvance, which lets LearnPage
 * decide where to navigate next. Extracted from the old CurriculumPanel —
 * same step logic, now driven by route params instead of internal index state.
 */
import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, ExternalLink, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { hasGitterAiActivated } from '../../lib/gitterKeys'
import { fetchCompletedLessonIds, saveLessonStep } from '../../lib/lessonProgress'
import type { Lesson } from '../../content/lessons'
import LessonPlayer from './LessonPlayer'
import QuizStep from './QuizStep'
import GitSandbox from './GitSandbox'

const GITTER_GATE_MODULE = 'mod-01'
const GUEST_TASK_STORAGE = 'devflow_guest_task_lessons'

function loadGuestTaskIds(): string[] {
  try {
    const saved = localStorage.getItem(GUEST_TASK_STORAGE)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

type Step = 'video' | 'quiz' | 'sandbox' | 'task' | 'recap'

interface ModuleLike { id: string; num: string; title: string }

interface Props {
  module: ModuleLike
  lessons: Lesson[]
  lessonId: string
  /** nextLessonId set -> advance within module. Unset -> module finished; caller decides where to go. */
  onAdvance: (nextLessonId: string | undefined, moduleCompleted: boolean) => void
}

export default function LessonContent({ module: mod, lessons, lessonId, onAdvance }: Props) {
  const { isLoggedIn } = useAuth()
  const { toggleModuleComplete } = useApp()

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGitterNotice, setShowGitterNotice] = useState(false)

  const lessonIndex = lessons.findIndex(l => l.id === lessonId)
  const currentLesson = lessons[lessonIndex]
  const [step, setStep] = useState<Step>(currentLesson?.type === 'task' ? 'task' : 'video')

  useEffect(() => {
    setStep(currentLesson?.type === 'task' ? 'task' : 'video')
  }, [lessonId, currentLesson?.type])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    const load = async () => {
      const ids = isLoggedIn ? await fetchCompletedLessonIds(mod.id) : loadGuestTaskIds()
      if (!cancelled) { setCompletedLessonIds(ids); setIsLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [mod.id, isLoggedIn])

  const finishLesson = useCallback(async () => {
    if (!currentLesson) return
    if (isLoggedIn) {
      await saveLessonStep(mod.id, currentLesson.id)
    } else {
      const next = Array.from(new Set([...loadGuestTaskIds(), currentLesson.id]))
      localStorage.setItem(GUEST_TASK_STORAGE, JSON.stringify(next))
    }
    const moduleCompleted = lessons.every(l =>
      l.id === currentLesson.id || completedLessonIds.includes(l.id)
    )
    const next = Array.from(new Set([...completedLessonIds, currentLesson.id]))
    setCompletedLessonIds(next)

    if (moduleCompleted && mod.id === GITTER_GATE_MODULE && !hasGitterAiActivated()) {
      setShowGitterNotice(true)
      return
    }
    if (moduleCompleted) toggleModuleComplete(mod.id)

    onAdvance(lessons[lessonIndex + 1]?.id, moduleCompleted)
  }, [currentLesson, isLoggedIn, completedLessonIds, lessons, lessonIndex, mod.id, toggleModuleComplete, onAdvance])

  if (isLoading) return <p className="text-sm" style={{ color: 'var(--text-on-accent-soft)' }}>Loading lessons…</p>
  if (!currentLesson) return <p className="text-sm" style={{ color: 'var(--text-on-accent-soft)' }}>Lesson not found in this module.</p>

  const isLessonDone = completedLessonIds.includes(currentLesson.id)

  return (
    <div className="max-w-2xl">
      {lessons.length > 1 && (
        <div className="flex items-center gap-1.5 mb-4">
          {lessons.map(l => (
            <span key={l.id} className={`h-1.5 flex-1 rounded-full ${
              completedLessonIds.includes(l.id) ? 'bg-[#3CCF4A]' : l.id === lessonId ? 'bg-[#F7B731]' : 'bg-black/10'
            }`} />
          ))}
        </div>
      )}
      <p className="font-accent text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-on-accent-soft)' }}>
        Lesson {lessonIndex + 1} of {lessons.length} · Module {mod.num}: {mod.title}
      </p>

      {currentLesson.type === 'task' ? (
        <div>
          <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-on-accent)' }}>{currentLesson.title}</h2>
          <ul className="space-y-2 mb-5">
            {currentLesson.checklist?.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-on-accent-soft)' }}>
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
        </div>
      ) : step === 'video' ? (
        <LessonPlayer lesson={currentLesson}
          onContinue={() => setStep(currentLesson.quiz ? 'quiz' : currentLesson.sandbox ? 'sandbox' : 'recap')} />
      ) : step === 'quiz' && currentLesson.quiz ? (
        <QuizStep questions={currentLesson.quiz}
          onComplete={() => (currentLesson.sandbox ? setStep('sandbox') : finishLesson())} />
      ) : step === 'sandbox' && currentLesson.sandbox ? (
        <GitSandbox task={currentLesson.sandbox} onSolved={finishLesson} />
      ) : (
        <div>
          <h2 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--text-on-accent)' }}>{currentLesson.title}</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-on-accent-soft)' }}>
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

      {showGitterNotice && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F7B731]/15 border border-[#F7B731]/30 px-4 py-3">
          <Sparkles className="w-4 h-4 text-[#F7B731] flex-shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: 'var(--text-on-accent-soft)' }}>
            Activate Gitter AI first — open the Gitter chat in the bottom-right corner and add a free API key.
            This is required before completing Module 1.
          </p>
        </div>
      )}
    </div>
  )
}
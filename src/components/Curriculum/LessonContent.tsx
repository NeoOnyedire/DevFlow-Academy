/**
 * LessonContent.tsx
 *
 * Renders one lesson's flow (video -> quiz -> sandbox, or the mod-00 task
 * checklist) and reports completion via onAdvance, which lets LearnPage
 * decide where to navigate next. Extracted from the old CurriculumPanel —
 * same step logic, now driven by route params instead of internal index state.
 *
 * THEME: all colors come from the curriculum classes in index.css
 * (cur-text, cur-card, cur-pill, ...). Avoid text-white / bg-white/NN
 * here — the Light-theme global overrides remap them.
 *
 * LINT FIX (react-hooks/set-state-in-effect):
 *  - The "which step am I on" state now lives in <LessonStepView
 *    key={lesson.id}>, so it resets by remounting instead of by an effect.
 *  - "Loading" is derived: the loaded ids are stored together with the
 *    key (module + auth state) they were fetched for, and we're loading
 *    whenever that key doesn't match the current one. The effect only
 *    calls setState from the promise callback, never synchronously.
 */
import { useEffect, useState } from 'react'
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

  // Completed ids are stored with the key they were loaded for; a key
  // mismatch means "still loading" without any synchronous setState.
  const loadKey = `${mod.id}:${isLoggedIn ? 'user' : 'guest'}`
  const [loaded, setLoaded] = useState<{ key: string; ids: string[] } | null>(null)
  const [showGitterNotice, setShowGitterNotice] = useState(false)

  const isLoading = loaded?.key !== loadKey
  const completedLessonIds = loaded?.key === loadKey ? loaded.ids : []

  const lessonIndex = lessons.findIndex(l => l.id === lessonId)
  const currentLesson = lessons[lessonIndex]

  useEffect(() => {
    let cancelled = false
    const idsPromise = isLoggedIn
      ? fetchCompletedLessonIds(mod.id)
      : Promise.resolve(loadGuestTaskIds())
    idsPromise.then(ids => {
      if (!cancelled) setLoaded({ key: loadKey, ids })
    })
    return () => { cancelled = true }
  }, [loadKey, mod.id, isLoggedIn])

  const finishLesson = async () => {
    if (!currentLesson) return
    if (isLoggedIn) {
      // saveLessonStep signature is (lessonId, moduleId, step, allLessonIdsInModule).
      // This call previously passed (moduleId, lessonId) with no step, which the
      // API rejected with a 400 — so server-side lesson progress never saved.
      await saveLessonStep(currentLesson.id, mod.id, 'complete', lessons.map(l => l.id))
    } else {
      const next = Array.from(new Set([...loadGuestTaskIds(), currentLesson.id]))
      localStorage.setItem(GUEST_TASK_STORAGE, JSON.stringify(next))
    }
    const moduleCompleted = lessons.every(l =>
      l.id === currentLesson.id || completedLessonIds.includes(l.id)
    )
    const next = Array.from(new Set([...completedLessonIds, currentLesson.id]))
    setLoaded({ key: loadKey, ids: next })

    if (moduleCompleted && mod.id === GITTER_GATE_MODULE && !hasGitterAiActivated()) {
      setShowGitterNotice(true)
      return
    }
    if (moduleCompleted) toggleModuleComplete(mod.id)

    onAdvance(lessons[lessonIndex + 1]?.id, moduleCompleted)
  }

  if (isLoading) return <p className="text-sm cur-text-soft">Loading lessons…</p>
  if (!currentLesson) return <p className="text-sm cur-text-soft">Lesson not found in this module.</p>

  const isLessonDone = completedLessonIds.includes(currentLesson.id)

  return (
    <div className="max-w-2xl">
      {lessons.length > 1 && (
        <div className="flex items-center gap-1.5 mb-4">
          {lessons.map(l => (
            <span key={l.id} className={`h-1.5 flex-1 rounded-full ${
              completedLessonIds.includes(l.id) ? 'cur-success-bg' : l.id === lessonId ? 'cur-pill' : 'cur-track'
            }`} />
          ))}
        </div>
      )}
      <p className="font-accent text-xs uppercase tracking-wider mb-4 cur-text-soft">
        Lesson {lessonIndex + 1} of {lessons.length} · Module {mod.num}: {mod.title}
      </p>

      <LessonStepView
        key={currentLesson.id}
        lesson={currentLesson}
        isLessonDone={isLessonDone}
        isLoggedIn={isLoggedIn}
        finishLesson={finishLesson}
      />

      {showGitterNotice && (
        <div className="cur-card mt-4 flex items-start gap-2 rounded-xl px-4 py-3">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 cur-link" />
          <p className="text-sm cur-text-soft">
            Activate Gitter AI first — open the Gitter chat in the bottom-right corner and add a free API key.
            This is required before completing Module 1.
          </p>
        </div>
      )}
    </div>
  )
}

interface StepViewProps {
  lesson: Lesson
  isLessonDone: boolean
  isLoggedIn: boolean
  finishLesson: () => void
}

/** Holds the per-lesson step. Remounted (via key) whenever the lesson changes. */
function LessonStepView({ lesson, isLessonDone, isLoggedIn, finishLesson }: StepViewProps) {
  const [step, setStep] = useState<Step>(lesson.type === 'task' ? 'task' : 'video')

  if (lesson.type === 'task') {
    return (
      <div>
        <h2 className="font-display font-bold text-2xl mb-2 cur-text">{lesson.title}</h2>
        <ul className="space-y-2 mb-5">
          {lesson.checklist?.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm cur-text-soft">
              <span className="flex-shrink-0 font-semibold cur-link">{i + 1}.</span> {item}
            </li>
          ))}
        </ul>
        {lesson.externalUrl && (
          <a href={lesson.externalUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm mb-5 underline underline-offset-2 hover:opacity-80 cur-link">
            Open GitHub signup <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={finishLesson} disabled={isLessonDone}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all
            ${isLessonDone ? 'cur-correct cur-success-text' : 'bg-rose-punch text-[#ffffff] hover:bg-[#ff3d5d]'}`}>
          <CheckCircle2 className="w-4 h-4" />
          {isLessonDone ? 'Completed' : isLoggedIn ? 'Mark lesson complete' : 'Mark as done (this browser only)'}
        </button>
      </div>
    )
  }

  if (step === 'video') {
    return (
      <LessonPlayer lesson={lesson}
        onContinue={() => setStep(lesson.quiz ? 'quiz' : lesson.sandbox ? 'sandbox' : 'recap')} />
    )
  }

  if (step === 'quiz' && lesson.quiz) {
    return (
      <QuizStep questions={lesson.quiz}
        onComplete={() => (lesson.sandbox ? setStep('sandbox') : finishLesson())} />
    )
  }

  if (step === 'sandbox' && lesson.sandbox) {
    return <GitSandbox task={lesson.sandbox} onSolved={finishLesson} />
  }

  return (
    <div>
      <h2 className="font-display font-bold text-2xl mb-3 cur-text">{lesson.title}</h2>
      <p className="text-sm mb-5 cur-text-soft">
        {isLessonDone ? "You've completed this lesson." : "No sandbox for this one — you're all set."}
      </p>
      {!isLessonDone && (
        <button onClick={finishLesson}
          className="bg-rose-punch text-[#ffffff] font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-all">
          Mark lesson complete
        </button>
      )}
    </div>
  )
}

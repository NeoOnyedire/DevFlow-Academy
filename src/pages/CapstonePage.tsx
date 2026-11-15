import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, GitFork } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import { CAPSTONE_PROJECTS } from '../content/capstones'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { fetchCompletedLessonIds, saveLessonStep } from '../lib/lessonProgress'

function loadGuestStepIds(storageKey: string): string[] {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export default function CapstonePage() {
  const { rolePath } = useApp()
  const { isLoggedIn, user } = useAuth()
  const project = CAPSTONE_PROJECTS[rolePath.id]
  const moduleId = `capstone-${project.id}`
  const storageKey = `devflow_capstone_${project.id}`
  const loadKey = `${moduleId}:${user?.id ?? 'guest'}`

  const [loaded, setLoaded] = useState<{ key: string; ids: string[]; error: string | null } | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [savingStepId, setSavingStepId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isLoading = loaded?.key !== loadKey
  const completedIds = loaded?.key === loadKey ? loaded.ids : []
  const loadError = loaded?.key === loadKey ? loaded.error : null
  const completedCount = completedIds.length
  const progressPercent = Math.round((completedCount / project.steps.length) * 100)

  useEffect(() => {
    let cancelled = false
    const progress = isLoggedIn
      ? fetchCompletedLessonIds(moduleId).then(result => ({
        ...result,
        ids: result.ids
          .filter(id => id.startsWith(`${project.id}-`))
          .map(id => id.slice(project.id.length + 1)),
      }))
      : Promise.resolve({ ids: loadGuestStepIds(storageKey), error: null })
    progress.then(result => {
      if (!cancelled) setLoaded({ key: loadKey, ...result })
    })
    return () => { cancelled = true }
  }, [isLoggedIn, loadAttempt, loadKey, moduleId, storageKey])

  const toggleStep = async (stepId: string) => {
    if (isLoading || loadError || !loaded || loaded.key !== loadKey) return

    const isComplete = completedIds.includes(stepId)
    const nextIds = isComplete
      ? completedIds.filter(id => id !== stepId)
      : [...completedIds, stepId]
    setSaveError(null)
    setSavingStepId(stepId)

    if (isLoggedIn) {
      const result = await saveLessonStep(`${project.id}-${stepId}`, moduleId, isComplete ? 'sandbox' : 'complete')
      if (!result.ok) {
        setSaveError(result.error || 'Could not save this capstone step. Please try again.')
        setSavingStepId(null)
        return
      }
    } else {
      localStorage.setItem(storageKey, JSON.stringify(nextIds))
    }

    setLoaded({ key: loadKey, ids: nextIds, error: null })
    setSavingStepId(null)
  }

  return (
    <PageWrapper bg="bg-curriculum">
      <section className="relative min-h-screen px-[6vw] py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <p className="font-accent text-xs uppercase tracking-[0.14em] cur-text-soft">
            {rolePath.label} · Guided capstone
          </p>
          <h1 className="mt-2 font-display font-bold tracking-[0.02em] leading-tight cur-text"
            style={{ fontSize: 'clamp(34px, 5vw, 64px)' }}>
            {project.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed cur-text-soft">{project.summary}</p>

          <div className="cur-card mt-7 rounded-2xl p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="font-accent text-xs uppercase tracking-[0.14em] cur-text-faint">Starter repository</p>
                <h2 className="mt-1 font-display text-xl font-bold cur-text">{project.repositoryName}</h2>
                <p className="mt-2 text-sm cur-text-soft">
                  Fork this exact repository, then follow the matching README and the steps below.
                </p>
              </div>
              <a href={project.repositoryUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-punch px-4 py-2.5 font-display text-sm font-semibold text-[#1F1F1F] hover:opacity-90">
                <GitFork className="h-4 w-4" /> Open starter repo <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 text-xs cur-text-soft">
                <span>Capstone progress</span>
                <span>{completedCount}/{project.steps.length} steps · {progressPercent}%</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full cur-track"
                role="progressbar"
                aria-label="Capstone progress"
                aria-valuemin={0}
                aria-valuemax={project.steps.length}
                aria-valuenow={completedCount}
              >
                <div className="h-full rounded-full bg-[#3CCF4A] transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-bold cur-text">Your project steps</h2>
            <p className="mt-2 text-sm cur-text-soft">
              Complete the work in GitHub, then check off each step here. {isLoggedIn
                ? 'Your progress is saved to your account.'
                : 'Your checklist is saved in this browser; sign in to sync it across devices.'}
            </p>

            {isLoading ? (
              <p role="status" className="mt-5 text-sm cur-text-soft">Loading capstone progress…</p>
            ) : loadError ? (
              <div className="mt-5">
                <p role="alert" className="text-sm text-rose-600">{loadError}</p>
                <button onClick={() => setLoadAttempt(attempt => attempt + 1)}
                  className="mt-3 rounded-xl bg-rose-punch px-4 py-2 font-display text-sm font-semibold text-[#1F1F1F]">
                  Retry loading progress
                </button>
              </div>
            ) : (
              <ol className="mt-5 space-y-4">
                {project.steps.map((step, index) => {
                  const checked = completedIds.includes(step.id)
                  const saving = savingStepId === step.id
                  return (
                    <li key={step.id} className="cur-card rounded-2xl p-5 md:p-6">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!!savingStepId}
                          onChange={() => { void toggleStep(step.id) }}
                          aria-label={`${checked ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`}
                          className="mt-1 h-4 w-4 accent-[#3CCF4A]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-accent text-xs uppercase tracking-wider cur-text-faint">
                              Step {index + 1}
                            </span>
                            {checked && <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Completed" />}
                            {saving && <span role="status" className="text-xs cur-text-faint">Saving…</span>}
                          </div>
                          <h3 className="mt-1 font-display text-lg font-bold cur-text">{step.title}</h3>
                          <ul className="mt-3 space-y-2 text-sm leading-relaxed cur-text-soft">
                            {step.instructions.map(instruction => <li key={instruction}>{instruction}</li>)}
                          </ul>
                          <p className="mt-4 text-sm cur-text">
                            <span className="font-semibold">Deliverable:</span> {step.deliverable}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}

            {saveError && <p role="alert" className="mt-4 text-sm text-rose-600">{saveError}</p>}
            {completedCount === project.steps.length && !isLoading && !loadError && (
              <p role="status" className="mt-6 rounded-xl bg-green-500/10 p-4 text-sm cur-text">
                Capstone complete. Share the repository on your portfolio and describe the Git workflow you practiced.
              </p>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}

import { useState } from 'react'
import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react'
import {
  getDueReviewCards,
  getReviewCards,
  getReviewIntervalLabel,
  recordReviewAnswer,
  type ReviewCard,
} from '../lib/spacedRepetition'

export default function SpacedReviewSection() {
  const [cards, setCards] = useState<ReviewCard[]>(() => getReviewCards())
  const dueIds = new Set(getDueReviewCards().map(card => card.id))
  const [sessionIds, setSessionIds] = useState<string[] | null>(null)
  const [sessionIndex, setSessionIndex] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ correct: boolean; intervalDays: number } | null>(null)

  const sessionCards = (sessionIds ?? [])
    .map(id => cards.find(card => card.id === id))
    .filter((card): card is ReviewCard => Boolean(card))
  const currentCard = sessionCards[sessionIndex]
  const dueCount = cards.filter(card => dueIds.has(card.id)).length

  const startSession = () => {
    const ordered = [...cards].sort((a, b) => {
      const aDue = dueIds.has(a.id) ? 0 : 1
      const bDue = dueIds.has(b.id) ? 0 : 1
      return aDue - bDue || a.dueAt - b.dueAt
    })
    setSessionIds(ordered.map(card => card.id))
    setSessionIndex(0)
    setSessionComplete(false)
    setSelected(null)
    setLastResult(null)
    setSaveError(null)
  }

  const answerQuestion = (optionIndex: number) => {
    if (!currentCard || selected !== null) return
    const correct = optionIndex === currentCard.question.correctIndex
    const result = recordReviewAnswer(currentCard.id, correct)
    if (!result.ok) {
      setSaveError(result.error)
      return
    }

    const updatedCards = getReviewCards()
    const updatedCard = updatedCards.find(card => card.id === currentCard.id)
    setCards(updatedCards)
    setSelected(optionIndex)
    setLastResult({
      correct,
      intervalDays: updatedCard?.intervalDays ?? 1,
    })
    setSaveError(null)
  }

  const nextQuestion = () => {
    if (!currentCard) return
    if (sessionIndex + 1 >= sessionCards.length) {
      setSessionComplete(true)
      setSelected(null)
      setLastResult(null)
      return
    }
    setSessionIndex(index => index + 1)
    setSelected(null)
    setLastResult(null)
    setSaveError(null)
  }

  return (
    <section id="spaced-review" className="scroll-mt-24 bg-espresso px-[6vw] py-12 md:py-16">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white/10 p-6 md:p-8 card-outline">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/90">Remember what you learn</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white">Spaced practice</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/90">
            Missed quiz questions return here. Correct answers are scheduled further apart over time; missed reviews come back sooner.
          </p>
          <p className="mt-2 text-xs text-white/90">
            Saved only in this browser. You can practice early or wait until a card is due.
          </p>
        </div>
        <div className="rounded-xl bg-black/20 px-4 py-3 text-sm text-white/90">
          <span className="font-semibold text-[#F7B731]">{dueCount}</span> due ·{' '}
          <span className="font-semibold text-white">{cards.length}</span> saved
        </div>
      </div>

      {sessionComplete ? (
        <div className="mt-6 rounded-xl bg-black/20 p-5 text-white">
          <p role="status" className="font-semibold">Review session complete.</p>
          <p className="mt-1 text-sm text-white/90">Your next reviews are scheduled based on how you answered.</p>
          <button onClick={startSession}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            <RotateCcw className="h-4 w-4" /> Practice again
          </button>
        </div>
      ) : currentCard ? (
        <div className="mt-6 max-w-3xl rounded-xl bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-white/90">
            Review {sessionIndex + 1} of {sessionCards.length} · {currentCard.moduleTitle} · {currentCard.lessonTitle}
          </p>
          <h3 className="mt-3 font-display text-xl font-bold text-white">{currentCard.question.question}</h3>
          <div className="mt-4 space-y-2">
            {currentCard.question.options.map((option, index) => {
              const isSelected = selected === index
              const isAnswer = index === currentCard.question.correctIndex
              const stateClass = selected === null
                ? 'bg-white/10 text-white hover:bg-white/15'
                : isAnswer
                  ? 'bg-emerald-500/20 text-white'
                  : isSelected
                    ? 'bg-rose-500/20 text-white'
                    : 'bg-white/5 text-white/60'
              return (
                <button key={option} disabled={selected !== null} onClick={() => answerQuestion(index)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left text-sm ${stateClass}`}>
                  {option}
                  {selected !== null && isAnswer && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300" />}
                </button>
              )
            })}
          </div>

          {selected !== null && lastResult && (
            <div role="status" className="mt-4 rounded-lg bg-white/10 p-4 text-sm text-white/90">
              <p className="font-semibold text-white">
                {lastResult.correct ? 'Correct — nice recall.' : 'Not quite. Review the key idea, then try it again next time.'}
              </p>
              <p className="mt-1">{currentCard.question.explanation}</p>
              <p className="mt-2 text-xs text-white/60">
                This card is scheduled again in {getReviewIntervalLabel(lastResult.intervalDays)}.
              </p>
              <button onClick={nextQuestion}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-punch px-4 py-2 font-semibold text-[#1F1F1F]">
                {sessionIndex + 1 === sessionCards.length ? 'Finish review' : 'Next question'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {saveError && <p role="alert" className="mt-3 text-sm text-rose-300">{saveError}</p>}
        </div>
      ) : cards.length === 0 ? (
        <p className="mt-6 rounded-xl bg-black/20 p-5 text-sm text-white/70">
          No review cards yet. Miss a quiz question and it will be added here, with a retry hint in the lesson.
        </p>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button onClick={startSession}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-punch px-5 py-3 font-display font-semibold text-[#1F1F1F]">
            <RotateCcw className="h-4 w-4" /> {dueCount ? `Review ${dueCount} due ${dueCount === 1 ? 'question' : 'questions'}` : 'Practice saved questions'}
          </button>
          {dueCount === 0 && (
            <p className="text-sm text-white/90">Nothing is due yet, but you can practice these questions early.</p>
          )}
        </div>
      )}
      </div>
    </section>
  )
}

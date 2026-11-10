/**
 * QuizStep.tsx
 *
 * Comprehension check between snippet and sandbox.
 * THEME: uses the curriculum classes from index.css (cur-card, cur-correct,
 * cur-wrong, cur-text*, cur-btn) instead of hardcoded rgba(0,0,0,..) fills,
 * which were invisible on the dark canvas.
 */
import { useState } from 'react'
import { Check, X, ArrowRight, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { QuizQuestion } from '../../content/lessons'
import { requestGitterHelp } from '../../lib/gitterSupport'
import { recordMissedQuestion } from '../../lib/spacedRepetition'

interface Props {
  questions: QuizQuestion[]
  lessonId: string
  lessonTitle: string
  moduleTitle: string
  onComplete: () => void
}

export default function QuizStep({ questions, lessonId, lessonTitle, moduleTitle, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [reviewSaveError, setReviewSaveError] = useState<string | null>(null)

  const question = questions[index]
  const isLast = index === questions.length - 1
  const isCorrect = selected === question.correctIndex

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return
    setSelected(optionIndex)
    if (optionIndex === question.correctIndex) {
      setCorrectCount(c => c + 1)
      setReviewSaveError(null)
    } else {
      const result = recordMissedQuestion({
        lessonId,
        lessonTitle,
        moduleTitle,
        question,
      })
      setReviewSaveError(result.error)
    }
  }

  const handleNext = () => {
    if (isLast) {
      onComplete()
      return
    }
    setIndex(i => i + 1)
    setSelected(null)
  }

  const handleRetry = () => setSelected(null)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="cur-card cur-text-soft px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <h2 className="font-display font-bold text-xl mb-5 cur-text">
        {question.question}
      </h2>

      <div className="space-y-2.5 mb-5">
        {question.options.map((option, i) => {
          const isSelected = selected === i
          const revealCorrect = selected !== null && i === question.correctIndex
          const stateClass = revealCorrect
            ? 'cur-correct'
            : isSelected
              ? 'cur-wrong'
              : 'cur-card cur-card-hover'
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between gap-3 ${stateClass}`}
            >
              <span className="text-sm cur-text">{option}</span>
              {revealCorrect && <Check className="w-4 h-4 flex-shrink-0 cur-success-text" />}
              {isSelected && !revealCorrect && <X className="w-4 h-4 flex-shrink-0 cur-danger-text" />}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="cur-card mb-5 p-4 rounded-xl">
          {!isCorrect && (
            <p className="text-sm font-semibold mb-2 cur-danger-text">
              Not quite. “{question.options[selected]}” is not the best answer.
            </p>
          )}
          <p className="text-sm leading-relaxed cur-text-soft">
            {!isCorrect && question.incorrectFeedback?.[selected]
              ? question.incorrectFeedback[selected]
              : !isCorrect
                ? `Your choice doesn’t match the key idea: ${question.explanation}`
                : question.explanation}
          </p>
          {!isCorrect && (
            <>
              <p className="text-sm mt-2 cur-text-soft">
                Correct answer: <strong className="cur-text">{question.options[question.correctIndex]}</strong>
              </p>
              <p className="text-sm mt-2 cur-text-soft">
                Retry hint: {question.retryHint ?? `Keep this idea in mind: ${question.explanation}`}
              </p>
              {reviewSaveError ? (
                <p role="alert" className="mt-2 text-sm cur-danger-text">
                  {reviewSaveError}
                </p>
              ) : (
                <p role="status" className="mt-2 text-sm cur-text-soft">
                  Added to spaced practice. Review is scheduled for tomorrow.{' '}
                  <Link to="/practice#spaced-review" className="font-semibold cur-link underline">
                    Practice this question now
                  </Link>
                </p>
              )}
              <button
                onClick={() => requestGitterHelp(
                  `I'm answering this Git curriculum quiz question: "${question.question}". I chose "${question.options[selected]}". The correct answer is "${question.options[question.correctIndex]}". Please explain why my choice is wrong and give me a short retry hint.`
                )}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold cur-link hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Ask Gitter for help (Lite is free)
              </button>
            </>
          )}
        </div>
      )}

      {selected !== null &&
        (isCorrect ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-rose-punch text-[#1F1F1F] font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-all"
          >
            {isLast ? 'Continue to sandbox' : 'Next question'} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="cur-btn flex items-center gap-2 font-display font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
          >
            Try again
          </button>
        ))}

      {correctCount > 0 && (
        <p className="text-xs mt-4 cur-text-soft">
          {correctCount} of {index + (selected !== null ? 1 : 0)} correct so far
        </p>
      )}
    </div>
  )
}

/**
 * QuizStep.tsx
 *
 * Comprehension check between snippet and sandbox.
 * THEME: uses the curriculum classes from index.css (cur-card, cur-correct,
 * cur-wrong, cur-text*, cur-btn) instead of hardcoded rgba(0,0,0,..) fills,
 * which were invisible on the dark canvas.
 */
import { useState } from 'react'
import { Check, X, ArrowRight } from 'lucide-react'
import type { QuizQuestion } from '../../content/lessons'

interface Props {
  questions: QuizQuestion[]
  onComplete: () => void
}

export default function QuizStep({ questions, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const question = questions[index]
  const isLast = index === questions.length - 1
  const isCorrect = selected === question.correctIndex

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return
    setSelected(optionIndex)
    if (optionIndex === question.correctIndex) setCorrectCount(c => c + 1)
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

      <h4 className="font-display font-bold text-xl mb-5 cur-text">
        {question.question}
      </h4>

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
          <p className="text-sm leading-relaxed cur-text-soft">
            {question.explanation}
          </p>
        </div>
      )}

      {selected !== null &&
        (isCorrect ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-rose-punch text-[#ffffff] font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-all"
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

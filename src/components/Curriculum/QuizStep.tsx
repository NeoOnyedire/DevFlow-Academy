/**
 * QuizStep.tsx
 *
 * Comprehension check between snippet and sandbox.
 * THEME: same yellow curriculum canvas as LessonPlayer — use
 * --text-on-accent* for body text so Light/Original stay dark-on-yellow
 * and Dark stays light-on-espresso.
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
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--border-on-accent)',
            color: 'var(--text-on-accent-soft)',
          }}
        >
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <h4
        className="font-display font-bold text-xl mb-5"
        style={{ color: 'var(--text-on-accent)' }}
      >
        {question.question}
      </h4>

      <div className="space-y-2.5 mb-5">
        {question.options.map((option, i) => {
          const isSelected = selected === i
          const revealCorrect = selected !== null && i === question.correctIndex
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                revealCorrect
                  ? 'bg-[#3CCF4A]/15 border-[#3CCF4A]'
                  : isSelected
                    ? 'bg-[#FF4D6D]/15 border-[#FF4D6D]'
                    : 'hover:opacity-90'
              }`}
              style={
                !revealCorrect && !isSelected
                  ? {
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      borderColor: 'var(--border-on-accent)',
                    }
                  : undefined
              }
            >
              <span className="text-sm" style={{ color: 'var(--text-on-accent)' }}>
                {option}
              </span>
              {revealCorrect && <Check className="w-4 h-4 text-[#3CCF4A] flex-shrink-0" />}
              {isSelected && !revealCorrect && <X className="w-4 h-4 text-[#FF4D6D] flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div
          className="mb-5 p-4 rounded-xl border"
          style={{
            backgroundColor: 'rgba(0,0,0,0.06)',
            borderColor: 'var(--border-on-accent)',
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-on-accent-soft)' }}>
            {question.explanation}
          </p>
        </div>
      )}

      {selected !== null &&
        (isCorrect ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-rose-punch text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-all"
          >
            {isLast ? 'Continue to sandbox' : 'Next question'} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 font-display font-semibold px-5 py-2.5 rounded-xl transition-all"
            style={{
              backgroundColor: 'rgba(0,0,0,0.08)',
              color: 'var(--text-on-accent)',
            }}
          >
            Try again
          </button>
        ))}

      {correctCount > 0 && (
        <p className="text-xs mt-4" style={{ color: 'var(--text-on-accent-soft)' }}>
          {correctCount} of {index + (selected !== null ? 1 : 0)} correct so far
        </p>
      )}
    </div>
  )
}

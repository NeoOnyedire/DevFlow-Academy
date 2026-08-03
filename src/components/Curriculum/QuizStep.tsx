/**
 * QuizStep.tsx
 *
 * 1-2 question comprehension check between watching a snippet and doing
 * the sandbox task. Not punitive — wrong answers show the explanation
 * immediately and let the learner retry the same question, rather than
 * failing them out or forcing a full re-watch. The goal is a beat of
 * reflection, not a gate designed to be hard.
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
    if (selected !== null) return // locked once answered
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
        <span className="px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-white/10 text-white/60">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <h4 className="font-display font-bold text-white text-xl mb-5">{question.question}</h4>

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
                    : 'bg-white/[0.06] border-white/10 hover:bg-white/[0.1]'
              }`}
            >
              <span className="text-white text-sm">{option}</span>
              {revealCorrect && <Check className="w-4 h-4 text-[#3CCF4A] flex-shrink-0" />}
              {isSelected && !revealCorrect && <X className="w-4 h-4 text-[#FF4D6D] flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="mb-5 p-4 rounded-xl bg-white/[0.06] border border-white/10">
          <p className="text-white/75 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {selected !== null && (
        isCorrect ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-rose-punch text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-all"
          >
            {isLast ? 'Continue to sandbox' : 'Next question'} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-white/10 text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-all"
          >
            Try again
          </button>
        )
      )}

      {correctCount > 0 && (
        <p className="text-white/30 text-xs mt-4">{correctCount} of {index + (selected !== null ? 1 : 0)} correct so far</p>
      )}
    </div>
  )
}

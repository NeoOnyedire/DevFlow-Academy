/**
 * ============================================================================
 * ScenarioPlaySection.tsx
 * ============================================================================
 *
 * Interactive Git scenario practice.
 *
 * Improvements:
 * - After answering, a large prominent "Next Scenario →" banner replaces
 *   the tucked-away button so it's impossible to miss
 * - Scenario tabs (01–04) show a coloured dot when that scenario has been
 *   answered in this session
 * - Reset now shows a native confirm dialog before clearing state
 * ============================================================================
 */

import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BadgeCheck, CircleAlert, Flame, RotateCcw, Sparkles, Trophy, ArrowRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  className?: string
}

interface ScenarioChoice {
  label: string
  detail: string
  points: number
}

interface Scenario {
  title: string
  role: string
  prompt: string
  command: string
  choices: ScenarioChoice[]
}

const SCENARIOS: Scenario[] = [
  {
    title: 'The Hotfix Sprint',
    role: 'Release captain',
    prompt: 'Production is broken, but your teammate has unfinished work on main. What is the cleanest first move?',
    command: 'git switch -c hotfix/payment-timeout',
    choices: [
      { label: 'Create a hotfix branch', detail: 'You isolate the repair and keep main reviewable.', points: 120 },
      { label: 'Commit directly to main', detail: 'Fast, but risky when the team needs a clear review trail.', points: 35 },
      { label: 'Delete the unfinished files', detail: 'That solves the wrong problem and loses teammate work.', points: 0 },
    ],
  },
  {
    title: 'The Conflict Room',
    role: 'Merge mediator',
    prompt: 'Your pull request conflicts with main. You need to bring main into your branch before asking for review.',
    command: 'git fetch origin && git merge origin/main',
    choices: [
      { label: 'Fetch, then merge main', detail: 'You reproduce the conflict locally and resolve it before review.', points: 140 },
      { label: 'Close the pull request', detail: 'Avoids the conflict, but abandons useful work.', points: 10 },
      { label: 'Force push immediately', detail: 'A force push does not resolve the merge conflict.', points: 0 },
    ],
  },
  {
    title: 'The Mystery Commit',
    role: 'History detective',
    prompt: 'A bug appeared yesterday. You need to inspect recent changes without altering the project.',
    command: 'git log --oneline --decorate -n 8',
    choices: [
      { label: 'Inspect recent history', detail: 'You gather evidence before changing anything.', points: 100 },
      { label: 'Reset to last week', detail: 'Too destructive before you know which commit caused the issue.', points: 5 },
      { label: 'Start a new repository', detail: 'That hides the history instead of investigating it.', points: 0 },
    ],
  },
  {
    title: 'The Almost Ready PR',
    role: 'Review finisher',
    prompt: 'Your feature works, but you accidentally staged a local notes file. What should you do?',
    command: 'git restore --staged notes.txt',
    choices: [
      { label: 'Unstage only the notes file', detail: 'You keep the feature staged and remove the stray file.', points: 110 },
      { label: 'Commit everything anyway', detail: 'The PR gets noisy and leaks local clutter.', points: 20 },
      { label: 'Delete the whole branch', detail: 'A small staging fix should not discard the feature.', points: 0 },
    ],
  },
]

export default function ScenarioPlaySection({ className = '' }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<ScenarioChoice | null>(null)
  const [totalPoints, setTotalPoints] = useState(() => Number(localStorage.getItem('devflow_scenario_points') || 0))
  const [plays, setPlays] = useState(() => Number(localStorage.getItem('devflow_scenario_plays') || 0))
  // Track which scenario indices have been answered this session
  const [answeredIndices, setAnsweredIndices] = useState<Set<number>>(new Set())

  const sectionRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])

  const scenario = SCENARIOS[activeIndex]
  const bestPoints = Math.max(...scenario.choices.map(c => c.points))
  const streak = Math.min(plays, 7)
  const rank = totalPoints >= 900 ? 'Gold' : totalPoints >= 450 ? 'Silver' : 'Rookie'

  const sortedChoices = useMemo(() => scenario.choices, [scenario])

  const chooseScenario = (index: number) => {
    setActiveIndex(index)
    setSelectedChoice(null)
  }

  const answerScenario = (choice: ScenarioChoice) => {
    if (selectedChoice) return
    const nextPoints = totalPoints + choice.points
    const nextPlays = plays + 1
    setSelectedChoice(choice)
    setTotalPoints(nextPoints)
    setPlays(nextPlays)
    setAnsweredIndices(prev => new Set(prev).add(activeIndex))
    localStorage.setItem('devflow_scenario_points', String(nextPoints))
    localStorage.setItem('devflow_scenario_plays', String(nextPlays))
  }

  const nextScenario = () => {
    setActiveIndex(current => (current + 1) % SCENARIOS.length)
    setSelectedChoice(null)
  }

  const resetRun = () => {
    const confirmed = window.confirm('Reset your points and streak? This cannot be undone.')
    if (!confirmed) return
    setSelectedChoice(null)
    setTotalPoints(0)
    setPlays(0)
    setAnsweredIndices(new Set())
    localStorage.removeItem('devflow_scenario_points')
    localStorage.removeItem('devflow_scenario_plays')
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current,
        { y: 64, opacity: 0 },
        {
          y: 0, opacity: 1,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 35%',
            scrub: 0.5,
          },
        }
      )
      cardsRef.current.forEach((card, index) => {
        if (!card) return
        gsap.fromTo(card,
          { y: 24, opacity: 0 },
          {
            y: 0, opacity: 1,
            delay: index * 0.04,
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              end: 'top 70%',
              scrub: 0.4,
            },
          }
        )
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="scenario-play"
      className={`${className} relative overflow-hidden`}
      style={{ padding: '9vh 6vw', minHeight: '100vh' }}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">

        {/* Left — stats */}
        <div className="max-w-xl">
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-[#2A2A2A]/60 mb-4">
            Interactive practice
          </p>
          <h2
            className="font-display font-bold heading-responsive tracking-[0.02em] text-[#2A2A2A] mb-5"
            style={{ fontSize: 'clamp(38px, 6vw, 88px)' }}
          >
            Play the Git Floor
          </h2>
          <p className="text-[#2A2A2A]/75 leading-relaxed mb-6" style={{ fontSize: 'clamp(15px, 1.2vw, 18px)' }}>
            Pick the move you would make in a real team situation. Smart decisions earn points, streaks, and a rank you can keep building.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/60 p-4 card-shadow" style={{ borderRadius: 8 }}>
              <Trophy className="w-5 h-5 text-[#FF4D6D] mb-3" />
              <p className="font-display text-2xl font-bold text-[#2A2A2A]">{totalPoints}</p>
              <p className="text-xs font-accent uppercase tracking-[0.12em] text-[#2A2A2A]/55">Points</p>
            </div>
            <div className="bg-white/60 p-4 card-shadow" style={{ borderRadius: 8 }}>
              <Flame className="w-5 h-5 text-orange-500 mb-3" />
              <p className="font-display text-2xl font-bold text-[#2A2A2A]">{streak}</p>
              <p className="text-xs font-accent uppercase tracking-[0.12em] text-[#2A2A2A]/55">Streak</p>
            </div>
            <div className="bg-white/60 p-4 card-shadow" style={{ borderRadius: 8 }}>
              <Sparkles className="w-5 h-5 text-[#3CCF4A] mb-3" />
              <p className="font-display text-2xl font-bold text-[#2A2A2A]">{rank}</p>
              <p className="text-xs font-accent uppercase tracking-[0.12em] text-[#2A2A2A]/55">Rank</p>
            </div>
          </div>
        </div>

        {/* Right — scenario panel */}
        <div ref={panelRef} className="bg-card-dark card-shadow text-white p-4 md:p-6" style={{ borderRadius: 8 }}>

          {/* Scenario tabs — show a dot when answered */}
          <div className="flex flex-wrap gap-2 mb-5">
            {SCENARIOS.map((item, index) => {
              const isAnswered = answeredIndices.has(index)
              return (
                <button
                  key={item.title}
                  onClick={() => chooseScenario(index)}
                  className={`relative px-3 py-2 text-xs font-accent uppercase tracking-[0.12em] transition-colors ${
                    activeIndex === index
                      ? 'bg-[#F7B731] text-[#2A2A2A]'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                  style={{ borderRadius: 8 }}
                >
                  {String(index + 1).padStart(2, '0')}
                  {/* Answered indicator dot */}
                  {isAnswered && activeIndex !== index && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3CCF4A] border-2 border-[#4A2F2F]" />
                  )}
                </button>
              )
            })}
            {/* Legend */}
            <span className="flex items-center gap-1 text-[10px] text-white/30 font-accent ml-1 self-center">
              <span className="w-2 h-2 rounded-full bg-[#3CCF4A] inline-block" />
              answered
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            {/* Scenario info */}
            <div>
              <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/45 mb-3">{scenario.role}</p>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">{scenario.title}</h3>
              <p className="text-white/75 leading-relaxed mb-5">{scenario.prompt}</p>
              <div className="bg-black/25 border border-white/10 p-4 font-mono text-sm text-[#F7B731]" style={{ borderRadius: 8 }}>
                {scenario.command}
              </div>
            </div>

            {/* Choice buttons */}
            <div className="space-y-3">
              {sortedChoices.map((choice, index) => {
                const isSelected = selectedChoice?.label === choice.label
                const isBest = choice.points === bestPoints
                const showResult = !!selectedChoice

                return (
                  <button
                    key={choice.label}
                    ref={el => { cardsRef.current[index] = el }}
                    onClick={() => answerScenario(choice)}
                    disabled={!!selectedChoice}
                    className={`w-full text-left p-4 border transition-all ${
                      isSelected
                        ? isBest
                          ? 'bg-[#3CCF4A]/20 border-[#3CCF4A]'
                          : 'bg-[#FF4D6D]/20 border-[#FF4D6D]'
                        : showResult && isBest
                          ? 'bg-[#3CCF4A]/10 border-[#3CCF4A]/40'
                          : 'bg-white/[0.07] border-white/10 hover:bg-white/[0.12] disabled:cursor-default'
                    }`}
                    style={{ borderRadius: 8 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                        showResult && isBest ? 'bg-[#3CCF4A]' : 'bg-white/10'
                      }`}>
                        {showResult && isBest ? (
                          <BadgeCheck className="h-4 w-4 text-[#173A1B]" />
                        ) : (
                          <span className="font-display text-sm text-white/75">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-display text-lg font-semibold text-white">{choice.label}</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">
                          {showResult ? choice.detail : `${choice.points} possible points`}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-5 border-t border-white/10 pt-4 space-y-3">

            {/* Prominent "Next Scenario" banner — only shown after answering */}
            {selectedChoice && (
              <button
                onClick={nextScenario}
                className="w-full flex items-center justify-between gap-3 px-5 py-4
                  bg-rose-punch hover:bg-[#ff3d5d] text-white font-display font-semibold
                  transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ borderRadius: 8, fontSize: 'clamp(14px, 1.1vw, 16px)' }}
              >
                <span>
                  {selectedChoice.points === bestPoints
                    ? `Perfect! +${selectedChoice.points} points — next scenario`
                    : `+${selectedChoice.points} points — try the next one`}
                </span>
                <ArrowRight className="h-5 w-5 flex-shrink-0" />
              </button>
            )}

            {/* Status row + reset */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-white/62">
                <CircleAlert className="h-4 w-4 text-[#F7B731] flex-shrink-0" />
                {selectedChoice
                  ? `You earned ${selectedChoice.points} pts on this scenario.`
                  : 'Choose one move to lock in your answer.'}
              </div>
              <button
                onClick={resetRun}
                className="flex items-center gap-2 bg-white/10 px-3 py-2 text-sm
                  font-semibold text-white/60 hover:bg-white/15 hover:text-white/80 transition-colors"
                style={{ borderRadius: 8 }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

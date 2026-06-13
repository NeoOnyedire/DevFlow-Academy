import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BadgeCheck, CircleAlert, Flame, RotateCcw, Sparkles, Trophy } from 'lucide-react'

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

  const sectionRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])

  const scenario = SCENARIOS[activeIndex]
  const bestPoints = Math.max(...scenario.choices.map(choice => choice.points))
  const streak = Math.min(plays, 7)
  const rank = totalPoints >= 900 ? 'Gold' : totalPoints >= 450 ? 'Silver' : 'Rookie'

  const sortedChoices = useMemo(() => {
    return scenario.choices
  }, [scenario])

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
    localStorage.setItem('devflow_scenario_points', String(nextPoints))
    localStorage.setItem('devflow_scenario_plays', String(nextPlays))
  }

  const nextScenario = () => {
    setActiveIndex(current => (current + 1) % SCENARIOS.length)
    setSelectedChoice(null)
  }

  const resetRun = () => {
    setSelectedChoice(null)
    setTotalPoints(0)
    setPlays(0)
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
          y: 0,
          opacity: 1,
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
            y: 0,
            opacity: 1,
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

        <div ref={panelRef} className="bg-card-dark card-shadow text-white p-4 md:p-6" style={{ borderRadius: 8 }}>
          <div className="flex flex-wrap gap-2 mb-5">
            {SCENARIOS.map((item, index) => (
              <button
                key={item.title}
                onClick={() => chooseScenario(index)}
                className={`px-3 py-2 text-xs font-accent uppercase tracking-[0.12em] transition-colors ${
                  activeIndex === index ? 'bg-[#F7B731] text-[#2A2A2A]' : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
                style={{ borderRadius: 8 }}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/45 mb-3">{scenario.role}</p>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">{scenario.title}</h3>
              <p className="text-white/75 leading-relaxed mb-5">{scenario.prompt}</p>
              <div className="bg-black/25 border border-white/10 p-4 font-mono text-sm text-[#F7B731]" style={{ borderRadius: 8 }}>
                {scenario.command}
              </div>
            </div>

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
                    className={`w-full text-left p-4 border transition-all ${
                      isSelected
                        ? isBest
                          ? 'bg-[#3CCF4A]/20 border-[#3CCF4A]'
                          : 'bg-[#FF4D6D]/20 border-[#FF4D6D]'
                        : 'bg-white/[0.07] border-white/10 hover:bg-white/[0.12]'
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
                        <p className="mt-1 text-sm leading-relaxed text-white/60">{showResult ? choice.detail : `${choice.points} possible points`}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 text-sm text-white/62">
              <CircleAlert className="h-4 w-4 text-[#F7B731]" />
              {selectedChoice ? `You earned ${selectedChoice.points} points on this scenario.` : 'Choose one move to lock in your answer.'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetRun}
                className="flex items-center gap-2 bg-white/10 px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/15"
                style={{ borderRadius: 8 }}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={nextScenario}
                className="bg-rose-punch px-4 py-2 text-sm font-display font-semibold text-white transition-transform hover:scale-105"
                style={{ borderRadius: 8 }}
              >
                Next Scenario
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

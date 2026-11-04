export type LearningRole = 'junior-dev' | 'devops' | 'career-switcher'

export interface WeeklyChallenge {
  id: string
  title: string
  brief: string
  command: string
  reward: number
  moduleId: string
}

const CHALLENGE_ROLES: LearningRole[] = ['junior-dev', 'devops', 'career-switcher']

const CHALLENGE_TEMPLATES = [
  {
    title: 'Branch Rescue',
    brief: 'A teammate mixed feature work into main. Create a clean recovery plan before anyone force pushes.',
    command: 'git switch -c rescue/clean-history',
    reward: 180,
    moduleId: 'mod-06',
  },
  {
    title: 'CI Fire Drill',
    brief: 'The build failed after a merge. Find the likely commit, open a fix branch, and keep the release moving.',
    command: 'git log --oneline -n 8',
    reward: 220,
    moduleId: 'mod-08',
  },
  {
    title: 'Review Ready PR',
    brief: 'Your feature works, but the branch has noisy commits. Prepare it for a calm teammate review.',
    command: 'git rebase -i origin/main',
    reward: 200,
    moduleId: 'mod-05',
  },
  {
    title: 'Conflict Clinic',
    brief: 'Two developers edited the same layout file. Resolve the conflict and explain the final choice.',
    command: 'git fetch origin && git merge origin/main',
    reward: 160,
    moduleId: 'mod-07',
  },
]

export function getCurrentWeekKey(date = new Date()): string {
  const year = date.getUTCFullYear()
  const start = Date.UTC(year, 0, 1)
  const dayMs = 24 * 60 * 60 * 1000
  const week = Math.ceil((((date.getTime() - start) / dayMs) + new Date(start).getUTCDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function getWeeklyChallenge(weekKey: string, role: LearningRole): WeeklyChallenge {
  const seed = [...weekKey, ...role].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const template = CHALLENGE_TEMPLATES[seed % CHALLENGE_TEMPLATES.length]
  const slug = template.title.toLowerCase().replace(/\s+/g, '-')

  return {
    id: `${weekKey}-${role}-${slug}`,
    ...template,
  }
}

export function getChallengeReward(weekKey: string, challengeId: string): number | null {
  for (const role of CHALLENGE_ROLES) {
    const challenge = getWeeklyChallenge(weekKey, role)
    if (challenge.id === challengeId) return challenge.reward
  }
  return null
}

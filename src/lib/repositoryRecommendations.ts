export interface RepositoryRecommendationSource {
  hasWorkflows: boolean
  openIssuesCount: number
  fork: boolean
  forkParent?: string | null
  languages: Record<string, number>
}

export interface RepositoryRecommendation {
  moduleId: string
  reason: string
}

export function getRepositoryRecommendations(
  repository: RepositoryRecommendationSource,
  roleModuleIds: string[],
  completedModuleIds: string[],
): RepositoryRecommendation[] {
  const candidates: RepositoryRecommendation[] = [
    {
      moduleId: 'mod-08',
      reason: repository.hasWorkflows
        ? 'This repository already has GitHub Actions workflows to explore.'
        : 'No GitHub Actions workflow was detected, so this project is a good place to practice adding CI.',
    },
  ]

  if (repository.openIssuesCount > 0) {
    candidates.push({
      moduleId: 'mod-04',
      reason: `This repository has ${repository.openIssuesCount} open issue${repository.openIssuesCount === 1 ? '' : 's'} or pull request${repository.openIssuesCount === 1 ? '' : 's'} to learn from.`,
    })
  }
  if (repository.fork) {
    candidates.push({
      moduleId: 'mod-05',
      reason: `As a fork${repository.forkParent ? ` of ${repository.forkParent}` : ''}, it is a useful place to practice contribution workflows.`,
    })
  }
  if (Object.keys(repository.languages).length > 1) {
    candidates.push({
      moduleId: 'mod-07',
      reason: 'Working across multiple languages makes isolated branches and careful merges especially useful.',
    })
  }

  for (const moduleId of roleModuleIds) {
    candidates.push({
      moduleId,
      reason: 'Continue with the next lesson in your selected learning path.',
    })
  }

  const completed = new Set(completedModuleIds)
  const seen = new Set<string>()
  return candidates.filter(candidate => {
    if (completed.has(candidate.moduleId) || seen.has(candidate.moduleId)) return false
    seen.add(candidate.moduleId)
    return true
  }).slice(0, 3)
}

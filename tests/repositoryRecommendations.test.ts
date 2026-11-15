import { describe, expect, it } from 'vitest'
import { getRepositoryRecommendations } from '../src/lib/repositoryRecommendations'

describe('repository lesson recommendations', () => {
  it('uses repository signals, skips completed modules, and fills from the learner path', () => {
    const recommendations = getRepositoryRecommendations({
      hasWorkflows: false,
      openIssuesCount: 3,
      fork: true,
      forkParent: 'upstream/project',
      languages: { TypeScript: 70, CSS: 30 },
    }, ['mod-01', 'mod-02', 'mod-03'], ['mod-08'])

    expect(recommendations).toEqual([
      {
        moduleId: 'mod-04',
        reason: 'This repository has 3 open issues or pull requests to learn from.',
      },
      {
        moduleId: 'mod-05',
        reason: 'As a fork of upstream/project, it is a useful place to practice contribution workflows.',
      },
      {
        moduleId: 'mod-07',
        reason: 'Working across multiple languages makes isolated branches and careful merges especially useful.',
      },
    ])
  })

  it('recommends CI practice for a repository without workflows', () => {
    const recommendations = getRepositoryRecommendations({
      hasWorkflows: false,
      openIssuesCount: 0,
      fork: false,
      languages: { TypeScript: 100 },
    }, ['mod-02'], [])

    expect(recommendations[0]).toMatchObject({ moduleId: 'mod-08' })
    expect(recommendations[0].reason).toContain('adding CI')
  })
})

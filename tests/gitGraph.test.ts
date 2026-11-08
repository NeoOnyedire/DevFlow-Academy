import { describe, expect, it } from 'vitest'
import { createMergeCommit, getCommitHistory, getMergeDisposition, type GitCommit } from '../src/lib/gitGraph'

const commits: GitCommit[] = [
  { hash: 'base', message: 'base', parentHash: null, branch: 'main', files: [], snapshot: [] },
  { hash: 'main-1', message: 'main work', parentHash: 'base', branch: 'main', files: [], snapshot: [] },
  { hash: 'feature-1', message: 'feature work', parentHash: 'base', branch: 'feature', files: [], snapshot: [] },
  {
    hash: 'merge-1',
    message: 'merge feature',
    parentHash: 'main-1',
    secondParentHash: 'feature-1',
    branch: 'main',
    files: [],
    snapshot: [],
  },
]

describe('git commit graph', () => {
  it('identifies when a branch can fast-forward', () => {
    expect(getMergeDisposition('base', 'main-1', commits)).toBe('fast-forward')
  })

  it('identifies when the source branch is already included', () => {
    expect(getMergeDisposition('merge-1', 'feature-1', commits)).toBe('already-up-to-date')
  })

  it('requires a merge commit for diverged branches', () => {
    expect(getMergeDisposition('main-1', 'feature-1', commits)).toBe('merge-commit')
  })

  it('creates a merge commit with both branch tips as parents', () => {
    expect(createMergeCommit('main', 'main-1', 'feature-1', 'new-merge', ['README.md'])).toMatchObject({
      parentHash: 'main-1',
      secondParentHash: 'feature-1',
    })
  })

  it('includes both parent histories after a merge', () => {
    expect(getCommitHistory('merge-1', commits).map(commit => commit.hash)).toEqual([
      'merge-1',
      'main-1',
      'base',
      'feature-1',
    ])
  })
})

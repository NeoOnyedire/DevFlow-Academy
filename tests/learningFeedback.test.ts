import { describe, expect, it } from 'vitest'
import { explainCommandFailure, getSequenceProgress } from '../src/lib/learningFeedback'
import { answerWithGitterLite } from '../src/lib/gitterLite'

describe('learning feedback', () => {
  it('explains common sandbox Git errors with a concrete next step', () => {
    expect(explainCommandFailure(["fatal: not a git repository (or any of the parent directories): .git"])).toEqual({
      reason: 'Git commands need to run inside an initialized repository.',
      retryHint: 'Run `git init` first, then retry your command.',
    })
    expect(explainCommandFailure(['git: `rebase` is not supported in this sandbox yet.'])).toMatchObject({
      reason: expect.stringContaining('simulator does not implement'),
      retryHint: expect.stringContaining('supported command'),
    })
    expect(explainCommandFailure(['On branch main', 'nothing to commit, working tree clean'], 'git status')).toBeNull()
    expect(explainCommandFailure(['nothing to commit (create/copy files and use "git add" to track)'], 'git commit -m "save"')).not.toBeNull()
    expect(explainCommandFailure(['Everything is up to date.'])).toBeNull()
  })

  it('shows the next required command after successful sequence steps', () => {
    const progress = getSequenceProgress([
      { cmd: 'git init', output: ['Initialized empty Git repository'] },
      { cmd: 'git add README.md', output: ['fatal: pathspec did not match any files'] },
      { cmd: 'git add README.md', output: ['Added README.md to the staging area'] },
    ], {
      prompt: 'Create and stage the README',
      expectedCommands: [],
      expectedCommandSequences: [['git init', 'git add README.md', 'git commit -m']],
      hint: 'Add the README, then commit it.',
    })

    expect(progress).toEqual({ completed: 2, total: 3, nextCommand: 'git commit -m' })
  })

  it('answers common Git sandbox errors in free Lite mode', () => {
    expect(answerWithGitterLite('Why did I get fatal: not a git repository?')).toContain('git init')
    expect(answerWithGitterLite('Why did git say nothing to commit?')).toContain('git add')
  })
})

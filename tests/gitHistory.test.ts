import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { GIT_HISTORY } from '../src/content/gitHistory'

function getCommitMetadata(commit: string): string[] {
  const output = execFileSync('git', [
    'show',
    '-s',
    '--format=%H%x09%ad%x09%an%x09%s',
    '--date=short',
    commit,
  ], { encoding: 'utf8' }).trimEnd()

  return output.split('\t')
}

describe('curated Git history', () => {
  it('matches every displayed hash, date, author, and subject to a real commit', () => {
    for (const entry of GIT_HISTORY) {
      expect(getCommitMetadata(entry.commit)).toEqual([
        entry.commit,
        entry.date,
        entry.author,
        entry.subject,
      ])
    }
  })

  it('lists selected commits newest first in repository log order', () => {
    const log = execFileSync('git', ['log', '--format=%H'], { encoding: 'utf8' })
      .trim()
      .split(/\r?\n/)
    const positions = GIT_HISTORY.map(entry => log.indexOf(entry.commit))

    expect(positions.every(position => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })
})

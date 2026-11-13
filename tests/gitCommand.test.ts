import { describe, expect, it } from 'vitest'
import { parseCommitMessage } from '../src/lib/gitCommand'

describe('parseCommitMessage', () => {
  it('accepts a message immediately after the -m flag', () => {
    expect(parseCommitMessage('git commit -m"Add README"')).toBe('Add README')
  })

  it('continues to accept whitespace before the message', () => {
    expect(parseCommitMessage('git commit -m "Add README"')).toBe('Add README')
  })

  it('returns null when the message is missing or empty', () => {
    expect(parseCommitMessage('git commit -m')).toBeNull()
    expect(parseCommitMessage('git commit -m ""')).toBeNull()
  })
})

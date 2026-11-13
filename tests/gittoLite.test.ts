import { describe, expect, it } from 'vitest'
import { answerWithGittoLite } from '../src/lib/gittoLite'

describe('Gitto password reset help', () => {
  it('offers the password reset flow for a natural-language request', () => {
    expect(answerWithGittoLite('How do I reset my password?')).toMatchObject({
      action: 'request-password-reset',
      text: expect.stringContaining('request a reset link'),
    })
  })

  it('explains that GitHub accounts reset passwords through GitHub', () => {
    expect(answerWithGittoLite('I forgot my password')).toMatchObject({
      action: 'request-password-reset',
      text: expect.stringContaining("GitHub's password recovery"),
    })
  })
})

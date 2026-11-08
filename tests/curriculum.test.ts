import { describe, expect, it } from 'vitest'
import { CURRICULUM_MODULES, ROLE_PATHS } from '../src/context/AppContext'
import { getLessonsForModule } from '../src/content/lessons'

describe('curriculum access and practice', () => {
  it('includes the guest account setup preview in every learning path', () => {
    expect(CURRICULUM_MODULES.some(module => module.id === 'mod-00')).toBe(true)
    expect(getLessonsForModule('mod-00')).toHaveLength(1)
    expect(ROLE_PATHS.every(path => path.recommendedModules.includes('mod-00'))).toBe(true)
  })

  it('requires an ordered end-to-end workflow for pull request practice', () => {
    const [lesson] = getLessonsForModule('mod-04').filter(item => item.id === 'mod-04-lesson-01')
    expect(lesson.sandbox?.expectedCommandSequences?.[0]).toEqual([
      'git init',
      'git switch -c feature/pr-practice',
      'git add README.md',
      'git commit -m',
      'git remote add origin',
      'git push',
    ])
    expect(lesson.sandbox?.requiredFiles).toContain('README.md')
  })

  it('provides interactive merge-conflict and workflow exercises', () => {
    const conflictLesson = getLessonsForModule('mod-07').find(item => item.id === 'mod-07-lesson-03')
    const workflowLesson = getLessonsForModule('mod-08').find(item => item.id === 'mod-08-lesson-02')

    expect(conflictLesson?.sandbox?.scenario).toBe('merge-conflict')
    expect(workflowLesson?.sandbox?.workflowRequirements).toEqual({
      event: 'pull_request',
      commands: ['npm ci', 'npm test'],
      actions: ['actions/checkout@v4'],
      path: '.github/workflows/ci.yml',
    })
  })
})

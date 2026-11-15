import { describe, expect, it } from 'vitest'
import { ROLE_PATHS } from '../src/context/AppContext'
import { CAPSTONE_PROJECTS } from '../src/content/capstones'

describe('role-specific capstone curriculum', () => {
  it('provides a linked, ordered capstone for every learning path', () => {
    expect(Object.keys(CAPSTONE_PROJECTS).sort())
      .toEqual(ROLE_PATHS.map(path => path.id).sort())

    for (const project of Object.values(CAPSTONE_PROJECTS)) {
      expect(project.repositoryUrl).toMatch(/^https:\/\/github\.com\/NeoOnyedire\//)
      expect(project.steps.length).toBeGreaterThanOrEqual(5)
      expect(new Set(project.steps.map(step => step.id)).size).toBe(project.steps.length)
    }
  })
})

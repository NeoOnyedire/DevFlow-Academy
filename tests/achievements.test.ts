import { describe, expect, it } from 'vitest'
import { getAchievements } from '../src/lib/achievements'

describe('learning achievements', () => {
  it('unlocks module milestones only when the real completion thresholds are met', () => {
    const achievements = getAchievements({
      completedModules: 4,
      totalModules: 9,
      completedChallenges: 0,
      hasSubmittedReview: false,
    })

    expect(achievements.filter(achievement => achievement.earned).map(achievement => achievement.id))
      .toEqual(['first-steps', 'learning-momentum'])
  })

  it('unlocks challenge and community achievements from their recorded activity', () => {
    const achievements = getAchievements({
      completedModules: 0,
      totalModules: 9,
      completedChallenges: 3,
      hasSubmittedReview: true,
    })

    expect(achievements.filter(achievement => achievement.earned).map(achievement => achievement.id))
      .toEqual(['challenge-accepted', 'challenge-regular', 'community-contributor'])
  })

  it('does not award course milestones for empty courses or impossible completion counts', () => {
    const achievements = getAchievements({
      completedModules: 10,
      totalModules: 0,
      completedChallenges: -1,
      hasSubmittedReview: false,
    })

    expect(achievements.some(achievement => achievement.earned)).toBe(false)
  })
})

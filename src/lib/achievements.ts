export interface AchievementProgress {
  completedModules: number
  totalModules: number
  completedChallenges: number
  hasSubmittedReview: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  earned: boolean
}

export function getAchievements(progress: AchievementProgress): Achievement[] {
  const totalModules = Math.max(0, Math.floor(progress.totalModules))
  const completedModules = Math.min(totalModules, Math.max(0, Math.floor(progress.completedModules)))
  const completedChallenges = Math.max(0, Math.floor(progress.completedChallenges))
  const halfwayMark = Math.ceil(totalModules / 2)

  return [
    {
      id: 'first-steps',
      title: 'First Steps',
      description: 'Complete your first module.',
      earned: totalModules > 0 && completedModules >= 1,
    },
    {
      id: 'learning-momentum',
      title: 'Learning Momentum',
      description: 'Complete three modules.',
      earned: totalModules >= 3 && completedModules >= 3,
    },
    {
      id: 'halfway-there',
      title: 'Halfway There',
      description: 'Complete at least half the course.',
      earned: totalModules > 0 && completedModules >= halfwayMark,
    },
    {
      id: 'course-finisher',
      title: 'Course Finisher',
      description: 'Complete every course module.',
      earned: totalModules > 0 && completedModules === totalModules,
    },
    {
      id: 'challenge-accepted',
      title: 'Challenge Accepted',
      description: 'Complete a weekly challenge.',
      earned: completedChallenges >= 1,
    },
    {
      id: 'challenge-regular',
      title: 'Challenge Regular',
      description: 'Complete three weekly challenges.',
      earned: completedChallenges >= 3,
    },
    {
      id: 'community-contributor',
      title: 'Community Contributor',
      description: 'Share feedback by submitting a course review.',
      earned: progress.hasSubmittedReview,
    },
  ]
}

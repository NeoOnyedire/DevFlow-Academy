export interface GitHistoryEntry {
  commit: string
  date: string
  author: string
  subject: string
  note: string
}

export const GIT_HISTORY: GitHistoryEntry[] = [
  {
    commit: 'c14649aeea7feb975675bf7e666994ec9196730f',
    date: '2026-11-08',
    author: 'neomv',
    subject: 'The CI workflow now installs Chromium and runs E2E tests on pull requests; the build waits for them to pass',
    note: 'This change added Playwright learner-journey coverage to the pull-request checks and made the production build wait for those browser tests.',
  },
  {
    commit: '12c0f7b677d448e80816bb92368f8879a9a73141',
    date: '2026-11-08',
    author: 'neomv',
    subject: 'Implemented improved learning feedback across the curriculum',
    note: 'Quiz retries, Git sandbox errors, and workflow validation now give learners explanations and actionable next steps, with optional contextual Gitter help.',
  },
  {
    commit: '9a8608cee13c947d176cef95822d239937abc087',
    date: '2026-11-08',
    author: 'neomv',
    subject: 'Implemented a more faithful commit and branch model for the Git sandbox',
    note: 'The sandbox began tracking branch references to commit hashes and modeling ancestry-aware merges, including fast-forwards and two-parent merge commits.',
  },
  {
    commit: 'f68b44c432fc6bacfda70705d4c52a0de53721b7',
    date: '2026-11-08',
    author: 'neomv',
    subject: 'Made the guest preview reachable/Strengthened Git practice/Added a GitHub Actions workflow lab',
    note: 'This curriculum update made the account setup preview available to guests, expanded command-sequence exercises, and introduced an editable workflow lab.',
  },
  {
    commit: 'd4f7f3583f79694d583e319abc68255085f5f654',
    date: '2026-11-04',
    author: 'neomv',
    subject: ' added focused tests for login behavior, admin access control, and account deletion.',
    note: 'The commit added route-level checks for admin access and login responses, plus account-deletion coverage that exercises retry behavior.',
  },
  {
    commit: 'cb9db45974f258605cd57c1690af975ad5d633f1',
    date: '2026-11-04',
    author: 'neomv',
    subject: 'security update 1',
    note: 'Leaderboard submissions started using server-defined weekly challenge IDs and reward points rather than trusting a client-supplied score.',
  },
  {
    commit: '282792721a8fc10a78b1bf67f2bad6e4fcff8f6c',
    date: '2026-10-11',
    author: 'neomv',
    subject: 'restore sessions from cookies',
    note: 'The app began restoring the signed-in user from the server session cookie on startup instead of relying on a cached client-side identity.',
  },
]

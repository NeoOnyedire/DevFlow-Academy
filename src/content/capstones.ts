import type { LearningRole } from '../../shared/weeklyChallenge'

export interface CapstoneStep {
  id: string
  title: string
  instructions: string[]
  deliverable: string
}

export interface CapstoneProject {
  id: LearningRole
  title: string
  repositoryName: string
  repositoryUrl: string
  summary: string
  steps: CapstoneStep[]
}

export const CAPSTONE_PROJECTS: Record<LearningRole, CapstoneProject> = {
  'junior-dev': {
    id: 'junior-dev',
    title: 'Team Task Board',
    repositoryName: 'devflow-junior-capstone',
    repositoryUrl: 'https://github.com/NeoOnyedire/devflow-junior-capstone',
    summary: 'Build a small task board while practicing issue-driven feature work, pull requests, conflict resolution, and releases.',
    steps: [
      {
        id: 'fork-and-clone',
        title: 'Fork and clone the project repo',
        instructions: [
          'Fork the linked project repository to your GitHub account.',
          'Clone your fork and check that origin points to your copy.',
          'Read the project brief and create a working branch for your first change.',
        ],
        deliverable: 'A local clone of your fork and a named working branch.',
      },
      {
        id: 'plan-the-board',
        title: 'Plan the board in an issue',
        instructions: [
          'Open an issue in your fork describing the first version of the task board.',
          'List the task fields and the minimum behavior a learner should be able to demonstrate.',
          'Record the issue number in PROJECT_PLAN.md.',
        ],
        deliverable: 'A scoped GitHub issue and a short project plan.',
      },
      {
        id: 'build-the-first-feature',
        title: 'Build and merge the first feature',
        instructions: [
          'Create a feature branch named feature/task-board.',
          'Add a simple HTML, CSS, and JavaScript board that can add a task and mark it done.',
          'Commit the work in small, descriptive commits, then open a pull request to your fork’s main branch.',
          'Review the diff and merge the pull request.',
        ],
        deliverable: 'A working first version merged through a pull request.',
      },
      {
        id: 'resolve-a-conflict',
        title: 'Create and resolve a merge conflict',
        instructions: [
          'From main, create feature/task-status and change the Board flow line in README.md; commit it.',
          'Return to main, create feature/task-priority, change that same line differently, and commit it.',
          'Merge feature/task-status into feature/task-priority and resolve the conflict so both ideas remain.',
        ],
        deliverable: 'A conflict-resolution commit on feature/task-priority.',
      },
      {
        id: 'review-and-merge',
        title: 'Review and merge the second pull request',
        instructions: [
          'Push feature/task-priority and open a pull request to your fork’s main branch.',
          'Check the changed files, commit history, and conflict resolution before merging.',
          'Ask a peer for review if possible; otherwise use the README review checklist.',
        ],
        deliverable: 'A reviewed pull request merged into main.',
      },
      {
        id: 'release-and-reflect',
        title: 'Publish a release and reflect',
        instructions: [
          'Tag the finished version v1.0.0 and create a GitHub release with a short summary.',
          'Add a retrospective to PROJECT_PLAN.md: what changed, what you learned, and what you would improve next.',
        ],
        deliverable: 'A v1.0.0 release and a concise project retrospective.',
      },
    ],
  },
  devops: {
    id: 'devops',
    title: 'Release Pipeline',
    repositoryName: 'devflow-devops-capstone',
    repositoryUrl: 'https://github.com/NeoOnyedire/devflow-devops-capstone',
    summary: 'Create a tiny Node.js health-check service and automate its tests with GitHub Actions, then practice diagnosing and safely rolling back a failed change.',
    steps: [
      {
        id: 'fork-and-clone',
        title: 'Fork and clone the project repo',
        instructions: [
          'Fork the linked project repository to your GitHub account and clone your fork.',
          'Use Node.js 22 and confirm the repository is clean before starting.',
          'Create a branch named feature/health-check.',
        ],
        deliverable: 'A local fork on a feature branch, ready for the service.',
      },
      {
        id: 'build-and-test',
        title: 'Build a small service with a test',
        instructions: [
          'Create a health-check function that returns a predictable healthy response.',
          'Add a test using Node’s built-in test runner and an npm test script.',
          'Generate and commit package-lock.json so clean installs are reproducible.',
        ],
        deliverable: 'A working health-check function and passing npm test.',
      },
      {
        id: 'automate-ci',
        title: 'Add pull-request CI',
        instructions: [
          'Create .github/workflows/ci.yml to run on pushes to main and pull requests.',
          'Use checkout and setup-node actions with Node.js 22, then run npm ci and npm test.',
          'Open a pull request and confirm the Actions check passes.',
        ],
        deliverable: 'A green GitHub Actions check on a pull request.',
      },
      {
        id: 'diagnose-a-failure',
        title: 'Diagnose and fix a failed check',
        instructions: [
          'On a separate branch, deliberately change the expected health response so a test fails.',
          'Push the branch and read the failed Actions log to identify the failing command.',
          'Fix the code or test, push again, and confirm the check turns green.',
        ],
        deliverable: 'A documented red-to-green CI run with the cause identified.',
      },
      {
        id: 'release-and-rollback',
        title: 'Release and practice a safe rollback',
        instructions: [
          'Merge the verified change and tag a v1.0.0 release.',
          'Make a small follow-up change on a branch and merge it.',
          'Use git revert to undo that change without rewriting shared history.',
        ],
        deliverable: 'A release tag and a rollback commit created with git revert.',
      },
      {
        id: 'write-the-runbook',
        title: 'Document the operating procedure',
        instructions: [
          'Add a short runbook explaining local setup, how to read a failed check, how to release, and how to roll back.',
          'Open a final pull request and verify its checks before merging.',
          'Do not add secrets or deployment credentials to the repository.',
        ],
        deliverable: 'A merged runbook and a clean, reproducible CI workflow.',
      },
    ],
  },
  'career-switcher': {
    id: 'career-switcher',
    title: 'Portfolio Case Study',
    repositoryName: 'devflow-career-capstone',
    repositoryUrl: 'https://github.com/NeoOnyedire/devflow-career-capstone',
    summary: 'Turn a project into credible portfolio evidence with a clear case study, reviewable Git history, a release, and an interview-ready story.',
    steps: [
      {
        id: 'fork-and-personalize',
        title: 'Fork and personalize the project repo',
        instructions: [
          'Fork the linked project repository to your GitHub account and clone your fork.',
          'Update the README title and project summary so they describe the work you want employers to see.',
          'Keep private client, employer, and personal information out of the public repository.',
        ],
        deliverable: 'A public fork with a clear, personalized project summary.',
      },
      {
        id: 'choose-the-case-study',
        title: 'Choose a project and define the evidence',
        instructions: [
          'Open a GitHub issue describing the project or work sample you will present.',
          'Create CASE_STUDY.md with the problem, your role, constraints, tools, decisions, and outcome.',
          'Link to a demo or screenshots only when you have permission to share them.',
        ],
        deliverable: 'A scoped issue and a draft case study backed by shareable evidence.',
      },
      {
        id: 'build-a-reviewable-change',
        title: 'Build the case study on a feature branch',
        instructions: [
          'Create a branch named feature/case-study.',
          'Add your case study and any permitted work sample or project documentation.',
          'Make focused commits with messages that explain the work.',
        ],
        deliverable: 'A reviewable branch with a polished case study.',
      },
      {
        id: 'practice-a-conflict',
        title: 'Practice resolving a documentation conflict',
        instructions: [
          'Create two branches from main that make different edits to the Case study focus line in README.md.',
          'Merge one branch into the other and resolve the conflict without losing either useful detail.',
          'Commit the resolution and verify the README still tells one consistent story.',
        ],
        deliverable: 'A conflict-resolution commit that preserves the final project narrative.',
      },
      {
        id: 'review-and-release',
        title: 'Review and release your portfolio project',
        instructions: [
          'Open a pull request to your fork’s main branch and review it as an employer would.',
          'Check links, spelling, screenshots, commit history, and public-data safety; request peer feedback if possible.',
          'Merge the pull request, tag v1.0.0, and add relevant repository topics.',
        ],
        deliverable: 'A polished, released repository that is ready to share.',
      },
      {
        id: 'prepare-the-interview-story',
        title: 'Prepare an interview-ready story',
        instructions: [
          'Write INTERVIEW_STORY.md using Situation, Task, Action, and Result.',
          'Use specific decisions and outcomes from the repository rather than unsupported claims.',
          'Practice a concise answer and link it from the case study if appropriate.',
        ],
        deliverable: 'A truthful STAR story grounded in the project evidence.',
      },
    ],
  },
}

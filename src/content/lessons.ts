// src/content/lessons.ts
//
// The new, more granular curriculum shape: a module is a small set of
// short lessons, and every lesson (except the account-setup one) is
// Snippet -> Quiz -> Sandbox, not one 45-90 minute video with a single
// "mark complete" button at the end.
//
// mod-00 is special: it's the "create a GitHub account" lesson, and it's
// the ONE lesson in the whole curriculum visible to guests (no login
// required) — see CurriculumPanel's canWatchModule / FREE_PREVIEW logic.
// It has no video and no quiz, just a short checklist task, since the
// entire point is to get someone an account before anything else.
//
// Video snippets use YouTube's own start/end params (?start=&end=) against
// real chapter markers pulled from each video's official description —
// not arbitrary cut points, so the snippet is a coherent standalone idea.
// Only Module 1 is fully authored below as the reference implementation;
// the TODO stubs after it show the exact shape the remaining modules
// (mod-02 .. mod-08) need filled in the same way, using their own videos'
// chapter lists.

export type LessonType = 'task' | 'video-quiz-sandbox'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface SandboxTask {
  prompt: string
  /** Command(s) considered a correct solution — GitSandbox does loose matching, not exact string compare. */
  expectedCommands: string[]
  hint: string
}

export interface Lesson {
  id: string
  moduleId: string
  type: LessonType
  title: string
  /** Roughly how long this lesson takes end to end — shown in the UI so it doesn't feel open-ended. */
  estimatedMinutes: number

  // video-quiz-sandbox lessons only:
  youtubeId?: string
  startSeconds?: number
  endSeconds?: number
  quiz?: QuizQuestion[]
  sandbox?: SandboxTask

  // task lessons only (mod-00):
  checklist?: string[]
  externalUrl?: string
}

/** mod-00 — the one lesson visible to guests. No account needed to complete "make an account." */
export const ACCOUNT_SETUP_LESSON: Lesson = {
  id: 'lesson-00-account',
  moduleId: 'mod-00',
  type: 'task',
  title: 'Create your GitHub account',
  estimatedMinutes: 3,
  externalUrl: 'https://github.com/signup',
  checklist: [
    'Go to github.com/signup and choose a username you\'d be comfortable putting on a resume.',
    'Verify your email address — GitHub will block most features until you do.',
    'Pick the Free plan (it\'s all you need for this entire course).',
    'Come back here and mark this lesson complete.',
  ],
}

export const MOD_01_LESSONS: Lesson[] = [
  {
    id: 'mod-01-lesson-01',
    moduleId: 'mod-01',
    type: 'video-quiz-sandbox',
    title: 'What is Git & GitHub, really?',
    estimatedMinutes: 6,
    youtubeId: 'mAFoROnOfHs',
    startSeconds: 64,    // 0:01:04 "What is Git & Version Control?"
    endSeconds: 341,     // 0:05:41 end of "Git vs. GitHub Explained"
    quiz: [
      {
        id: 'q1',
        question: 'What is Git, in one sentence?',
        options: [
          'A website for hosting code',
          'A version control system that tracks changes to files over time',
          'A programming language',
          'A tool for writing commit messages',
        ],
        correctIndex: 1,
        explanation: 'Git runs on your machine and tracks history — GitHub is the website built around it.',
      },
      {
        id: 'q2',
        question: 'What is GitHub, compared to Git?',
        options: [
          'The same thing, just a different name',
          'A cloud-hosting service for repositories that use Git underneath',
          'A replacement for Git that doesn\'t need it installed',
          'A code editor',
        ],
        correctIndex: 1,
        explanation: 'GitHub hosts and adds collaboration features (PRs, issues) on top of Git — you could use Git without ever touching GitHub.',
      },
    ],
    sandbox: {
      prompt: 'No commands yet — just confirm the sandbox is loaded by checking its status.',
      expectedCommands: ['git status'],
      hint: 'Type: git status',
    },
  },
  {
    id: 'mod-01-lesson-02',
    moduleId: 'mod-01',
    type: 'video-quiz-sandbox',
    title: 'Local vs. remote repositories',
    estimatedMinutes: 5,
    youtubeId: 'mAFoROnOfHs',
    startSeconds: 341,   // 0:05:41
    endSeconds: 577,     // 0:09:37 end of "Git Architecture"
    quiz: [
      {
        id: 'q1',
        question: 'Where does your "local" repository live?',
        options: ['On GitHub\'s servers', 'On your own computer', 'Nowhere until you push', 'In your browser'],
        correctIndex: 1,
        explanation: 'Local = your machine. Remote = the copy hosted elsewhere (usually GitHub).',
      },
    ],
    sandbox: {
      prompt: 'Initialize a new local repository in this sandbox folder.',
      expectedCommands: ['git init'],
      hint: 'Type: git init',
    },
  },
  {
    id: 'mod-01-lesson-03',
    moduleId: 'mod-01',
    type: 'video-quiz-sandbox',
    title: 'git init & your first repo',
    estimatedMinutes: 6,
    youtubeId: 'mAFoROnOfHs',
    startSeconds: 881,   // 0:14:41 "git init: Initializing a Repository"
    endSeconds: 964,     // 0:16:04
    quiz: [
      {
        id: 'q1',
        question: 'What does `git init` do?',
        options: [
          'Uploads your project to GitHub',
          'Turns the current folder into a Git repository',
          'Deletes all uncommitted changes',
          'Installs Git on your machine',
        ],
        correctIndex: 1,
        explanation: '`git init` creates a hidden .git folder that starts tracking history for the current directory — nothing leaves your machine yet.',
      },
    ],
    sandbox: {
      prompt: 'Create a file called README.md, then check what Git thinks of it.',
      expectedCommands: ['git status'],
      hint: 'Use the "New file" button to create README.md, then type: git status',
    },
  },
  {
    id: 'mod-01-lesson-04',
    moduleId: 'mod-01',
    type: 'video-quiz-sandbox',
    title: 'Staging changes with git add',
    estimatedMinutes: 6,
    youtubeId: 'mAFoROnOfHs',
    startSeconds: 1220,  // 0:20:20 "git status: Tracking Changes"
    endSeconds: 1470,    // 0:24:30 end of git add variations
    quiz: [
      {
        id: 'q1',
        question: 'Why does Git have a separate "staging" step before committing?',
        options: [
          'It doesn\'t — staging is optional and rarely used',
          'It lets you choose exactly which changes go into the next commit',
          'It automatically fixes bugs in your code',
          'It\'s required to connect to GitHub',
        ],
        correctIndex: 1,
        explanation: 'Staging is a deliberate "what goes in this commit" step — you can edit five files and only commit two of them.',
      },
      {
        id: 'q2',
        question: 'Which command stages every changed file at once?',
        options: ['git add .', 'git commit -a', 'git push --all', 'git status --all'],
        correctIndex: 0,
        explanation: '`git add .` stages everything in and below the current folder. `git add <file>` stages just one.',
      },
    ],
    sandbox: {
      prompt: 'Stage README.md for the next commit.',
      expectedCommands: ['git add README.md', 'git add .'],
      hint: 'Type: git add README.md',
    },
  },
  {
    id: 'mod-01-lesson-05',
    moduleId: 'mod-01',
    type: 'video-quiz-sandbox',
    title: 'Committing with git commit',
    estimatedMinutes: 6,
    youtubeId: 'mAFoROnOfHs',
    startSeconds: 1822,  // 0:30:22 "git commit: Saving Changes Permanently"
    endSeconds: 1932,    // 0:32:12
    quiz: [
      {
        id: 'q1',
        question: 'What\'s a good commit message?',
        options: [
          '"fixed stuff"',
          '"Fix login redirect on expired session"',
          'Leave it blank, Git fills it in',
          '"asdkjhaskdjh"',
        ],
        correctIndex: 1,
        explanation: 'Short, specific, present-tense — future-you (and your team) will thank you when scanning `git log`.',
      },
    ],
    sandbox: {
      prompt: 'Commit your staged changes with a clear message.',
      expectedCommands: ['git commit -m'],
      hint: 'Type: git commit -m "Add README"',
    },
  },
  {
    id: 'mod-01-lesson-06',
    moduleId: 'mod-01',
    type: 'video-quiz-sandbox',
    title: 'Branching basics',
    estimatedMinutes: 6,
    youtubeId: 'mAFoROnOfHs',
    startSeconds: 2458,  // 0:40:58 "Git Branching Explained"
    endSeconds: 2633,    // 0:43:53 end, right before checkout
    quiz: [
      {
        id: 'q1',
        question: 'Why create a new branch instead of working directly on main?',
        options: [
          'Branches are required by GitHub',
          'It isolates your work-in-progress so main stays stable and reviewable',
          'It makes your commits smaller',
          'There\'s no real reason, it\'s just convention',
        ],
        correctIndex: 1,
        explanation: 'A branch is a safe sandbox for a change — main is unaffected until you merge it back in.',
      },
    ],
    sandbox: {
      prompt: 'Create and switch to a new branch called feature/readme.',
      expectedCommands: ['git switch -c feature/readme', 'git checkout -b feature/readme'],
      hint: 'Type: git switch -c feature/readme',
    },
  },
  {
    id: 'mod-01-lesson-07',
    moduleId: 'mod-01',
    type: 'video-quiz-sandbox',
    title: 'Merging branches',
    estimatedMinutes: 6,
    youtubeId: 'mAFoROnOfHs',
    startSeconds: 2750,  // 0:45:50 "git merge: Combining Branches"
    endSeconds: 2863,    // 0:47:43
    quiz: [
      {
        id: 'q1',
        question: 'To merge feature/readme into main, which branch should you be on when you run `git merge feature/readme`?',
        options: ['feature/readme', 'main', 'Doesn\'t matter', 'A brand new branch'],
        correctIndex: 1,
        explanation: '`git merge <branch>` merges that branch INTO whatever branch you\'re currently on — so you check out main first.',
      },
    ],
    sandbox: {
      prompt: 'Switch back to main, then merge feature/readme into it.',
      expectedCommands: ['git switch main', 'git merge feature/readme'],
      hint: 'Type: git switch main, then: git merge feature/readme',
    },
  },
]

/**
 * ============================================================================
 * mod-02 through mod-08
 * ============================================================================
 * IMPORTANT — timestamp accuracy: mod-01's startSeconds/endSeconds came from
 * that video's real, official YouTube chapter list (fetched directly from
 * its description). YouTube rate-limited further chapter lookups while
 * authoring these remaining modules, so the timestamps below are ESTIMATES
 * based on each video's known topic order and typical section length —
 * NOT verified against the actual chapter markers. Each is flagged inline.
 * Before shipping, repeat the mod-01 process: fetch the video's watch page,
 * read its "Chapters" list in the description, and correct these numbers.
 * The lesson titles, quiz content, and sandbox tasks are complete and don't
 * depend on the exact cut points — only the video seek positions need a pass.
 * ============================================================================
 */

export const MOD_02_LESSONS: Lesson[] = [
  {
    id: 'mod-02-lesson-01',
    moduleId: 'mod-02',
    type: 'video-quiz-sandbox',
    title: 'Configuring your Git identity',
    estimatedMinutes: 4,
    youtubeId: 'RGOj5yH7evk',
    startSeconds: 300, // ESTIMATE — verify against real chapters
    endSeconds: 480,
    quiz: [
      {
        id: 'q1',
        question: 'Why does Git ask you to set a name and email before your first commit?',
        options: [
          'To log into GitHub',
          'So every commit records who made it — this is local config, separate from your GitHub login',
          'It doesn\'t — this step is optional and never used',
          'To encrypt your repository',
        ],
        correctIndex: 1,
        explanation: '`git config` just labels your commits locally — it has nothing to do with authentication.',
      },
    ],
    sandbox: {
      prompt: 'Set your Git username to "Learner" and your email to "learner@example.com".',
      expectedCommands: ['git config user.name', 'git config user.email'],
      hint: 'Type: git config user.name "Learner", then: git config user.email "learner@example.com"',
    },
  },
  {
    id: 'mod-02-lesson-02',
    moduleId: 'mod-02',
    type: 'video-quiz-sandbox',
    title: 'Cloning an existing repository',
    estimatedMinutes: 5,
    youtubeId: 'RGOj5yH7evk',
    startSeconds: 720, // ESTIMATE
    endSeconds: 900,
    quiz: [
      {
        id: 'q1',
        question: 'What does `git clone <url>` actually download?',
        options: [
          'Only the latest file versions, no history',
          'The full repository, including its entire commit history',
          'A read-only preview you can\'t edit',
          'Just the README',
        ],
        correctIndex: 1,
        explanation: 'Cloning gives you a complete, independent copy of the repo — history and all, ready to branch and commit in immediately.',
      },
    ],
    sandbox: {
      prompt: 'Clone the sample repository into this sandbox.',
      expectedCommands: ['git clone'],
      hint: 'Type: git clone https://github.com/example/sample-repo.git',
    },
  },
  {
    id: 'mod-02-lesson-03',
    moduleId: 'mod-02',
    type: 'video-quiz-sandbox',
    title: 'Connecting a remote & pushing',
    estimatedMinutes: 5,
    youtubeId: 'RGOj5yH7evk',
    startSeconds: 1080, // ESTIMATE
    endSeconds: 1260,
    quiz: [
      {
        id: 'q1',
        question: 'What is "origin" by convention?',
        options: [
          'The name of your first commit',
          'The default nickname for a repo\'s primary remote',
          'A required branch name',
          'GitHub\'s name for your account',
        ],
        correctIndex: 1,
        explanation: '"origin" is just a convention — a friendly name for a remote URL so you don\'t retype it every time.',
      },
    ],
    sandbox: {
      prompt: 'Add a remote named origin, then push your commits to it.',
      expectedCommands: ['git remote add origin', 'git push'],
      hint: 'Type: git remote add origin https://github.com/you/repo.git, then: git push',
    },
  },
  {
    id: 'mod-02-lesson-04',
    moduleId: 'mod-02',
    type: 'video-quiz-sandbox',
    title: 'Fetch vs. pull',
    estimatedMinutes: 4,
    youtubeId: 'RGOj5yH7evk',
    startSeconds: 1440, // ESTIMATE
    endSeconds: 1590,
    quiz: [
      {
        id: 'q1',
        question: 'What\'s the difference between `git fetch` and `git pull`?',
        options: [
          'They\'re identical',
          'Fetch downloads remote changes without merging them; pull fetches AND merges in one step',
          'Fetch is only for the first download; pull is for every download after that',
          'Pull only works with GitHub, fetch works with any remote',
        ],
        correctIndex: 1,
        explanation: '`git pull` is really shorthand for `git fetch` + `git merge` — fetch alone lets you inspect before merging.',
      },
    ],
    sandbox: {
      prompt: 'Fetch from origin, then pull the latest changes.',
      expectedCommands: ['git fetch', 'git pull'],
      hint: 'Type: git fetch, then: git pull',
    },
  },
]

export const MOD_03_LESSONS: Lesson[] = [
  {
    id: 'mod-03-lesson-01',
    moduleId: 'mod-03',
    type: 'video-quiz-sandbox',
    title: 'Reading history with git log & git diff',
    estimatedMinutes: 5,
    youtubeId: 'vA5TTz6BXhY',
    startSeconds: 600, // ESTIMATE
    endSeconds: 780,
    quiz: [
      {
        id: 'q1',
        question: 'What does `git diff` show you?',
        options: [
          'A list of all branches',
          'The exact line-by-line changes between two states of your files',
          'Who owns each file',
          'A backup of your repository',
        ],
        correctIndex: 1,
        explanation: '`git diff` is your "what actually changed" tool — invaluable before staging or committing.',
      },
    ],
    sandbox: {
      prompt: 'Look at your commit history, then check for any uncommitted differences.',
      expectedCommands: ['git log', 'git diff'],
      hint: 'Type: git log --oneline, then: git diff',
    },
  },
  {
    id: 'mod-03-lesson-02',
    moduleId: 'mod-03',
    type: 'video-quiz-sandbox',
    title: 'Removing & restoring files',
    estimatedMinutes: 5,
    youtubeId: 'vA5TTz6BXhY',
    startSeconds: 900, // ESTIMATE
    endSeconds: 1080,
    quiz: [
      {
        id: 'q1',
        question: '`git restore <file>` discards uncommitted local changes to that file. What\'s the safety implication?',
        options: [
          'None — it\'s always fully reversible',
          'Those changes are gone for good if they were never committed or staged',
          'It only works on branches, not files',
          'It asks for confirmation automatically',
        ],
        correctIndex: 1,
        explanation: 'Git can only undo what it has a record of — uncommitted work restore discards is genuinely gone.',
      },
    ],
    sandbox: {
      prompt: 'Remove a tracked file, then restore another file\'s uncommitted changes.',
      expectedCommands: ['git rm', 'git restore'],
      hint: 'Type: git rm old-file.txt, then: git restore README.md',
    },
  },
  {
    id: 'mod-03-lesson-03',
    moduleId: 'mod-03',
    type: 'video-quiz-sandbox',
    title: 'git reset: soft vs. hard',
    estimatedMinutes: 6,
    youtubeId: 'vA5TTz6BXhY',
    startSeconds: 1260, // ESTIMATE
    endSeconds: 1440,
    quiz: [
      {
        id: 'q1',
        question: 'Which reset mode keeps your file changes but un-does the commit itself?',
        options: ['--hard', '--soft or --mixed', 'There is no such option', '--force'],
        correctIndex: 1,
        explanation: '--soft/--mixed rewind the commit pointer but keep your edits around; --hard throws the changes away too — use it carefully.',
      },
    ],
    sandbox: {
      prompt: 'Undo your last commit while keeping the file changes.',
      expectedCommands: ['git reset'],
      hint: 'Type: git reset --soft HEAD~1',
    },
  },
]

export const MOD_04_LESSONS: Lesson[] = [
  {
    id: 'mod-04-lesson-01',
    moduleId: 'mod-04',
    type: 'video-quiz-sandbox',
    title: 'Why pull requests exist',
    estimatedMinutes: 5,
    youtubeId: 'tRZGeaHPoaw',
    startSeconds: 240, // ESTIMATE
    endSeconds: 420,
    quiz: [
      {
        id: 'q1',
        question: 'What is a pull request, fundamentally?',
        options: [
          'A backup of your code',
          'A request to merge one branch into another, with a place for discussion and review first',
          'A way to delete old branches',
          'A GitHub-only replacement for commits',
        ],
        correctIndex: 1,
        explanation: 'A PR is a proposal + a conversation — nothing merges until someone (often you) approves it.',
      },
    ],
    sandbox: {
      prompt: 'Push a feature branch so it\'s ready to open as a pull request.',
      expectedCommands: ['git push'],
      hint: 'Type: git switch -c feature/pr-practice, then: git push',
    },
  },
  {
    id: 'mod-04-lesson-02',
    moduleId: 'mod-04',
    type: 'video-quiz-sandbox',
    title: 'Writing a review-ready PR description',
    estimatedMinutes: 4,
    youtubeId: 'tRZGeaHPoaw',
    startSeconds: 600, // ESTIMATE
    endSeconds: 750,
    quiz: [
      {
        id: 'q1',
        question: 'What makes a pull request easy to review?',
        options: [
          'A vague title like "updates"',
          'A clear description of what changed and why, plus small, focused commits',
          'As many files changed as possible in one PR',
          'No description — the code speaks for itself',
        ],
        correctIndex: 1,
        explanation: 'Reviewers aren\'t mind readers — context up front saves everyone round-trips.',
      },
    ],
  },
  {
    id: 'mod-04-lesson-03',
    moduleId: 'mod-04',
    type: 'video-quiz-sandbox',
    title: 'Merging a reviewed PR',
    estimatedMinutes: 5,
    youtubeId: 'tRZGeaHPoaw',
    startSeconds: 900, // ESTIMATE
    endSeconds: 1080,
    quiz: [
      {
        id: 'q1',
        question: 'After a PR is approved and merged, what should you generally do with the feature branch?',
        options: [
          'Keep committing to it forever',
          'Delete it — its purpose is done once merged',
          'Rename it to main',
          'Nothing, branches never need cleanup',
        ],
        correctIndex: 1,
        explanation: 'A merged branch has served its purpose — deleting it keeps the branch list meaningful instead of cluttered.',
      },
    ],
    sandbox: {
      prompt: 'Switch to main and merge your feature branch into it.',
      expectedCommands: ['git switch main', 'git merge'],
      hint: 'Type: git switch main, then: git merge feature/pr-practice',
    },
  },
]

export const MOD_05_LESSONS: Lesson[] = [
  {
    id: 'mod-05-lesson-01',
    moduleId: 'mod-05',
    type: 'video-quiz-sandbox',
    title: 'Forking vs. cloning',
    estimatedMinutes: 4,
    youtubeId: 'apGV9Kg7ics',
    startSeconds: 300, // ESTIMATE
    endSeconds: 450,
    quiz: [
      {
        id: 'q1',
        question: 'When contributing to a project you don\'t have write access to, what do you do first?',
        options: [
          'Clone it and push directly',
          'Fork it on GitHub to get your own copy, then clone your fork',
          'Email the maintainer your code',
          'Nothing — anyone can push to any repo',
        ],
        correctIndex: 1,
        explanation: 'A fork is your own copy under your account — you contribute back via a pull request from it.',
      },
    ],
  },
  {
    id: 'mod-05-lesson-02',
    moduleId: 'mod-05',
    type: 'video-quiz-sandbox',
    title: 'Rebasing onto the latest main',
    estimatedMinutes: 6,
    youtubeId: 'apGV9Kg7ics',
    startSeconds: 720, // ESTIMATE
    endSeconds: 900,
    quiz: [
      {
        id: 'q1',
        question: 'What does rebasing your branch onto main actually do?',
        options: [
          'Deletes main',
          'Replays your branch\'s commits on top of main\'s latest commit, for a linear history',
          'Merges main into your branch, keeping both histories side by side',
          'Nothing different from a normal merge',
        ],
        correctIndex: 1,
        explanation: 'Rebase rewrites where your commits "start from" — the end result looks like you branched off the newest main all along.',
      },
    ],
    sandbox: {
      prompt: 'Rebase your current branch onto main.',
      expectedCommands: ['git rebase'],
      hint: 'Type: git rebase main',
    },
  },
  {
    id: 'mod-05-lesson-03',
    moduleId: 'mod-05',
    type: 'video-quiz-sandbox',
    title: 'Squashing messy commits',
    estimatedMinutes: 5,
    youtubeId: 'apGV9Kg7ics',
    startSeconds: 1080, // ESTIMATE
    endSeconds: 1260,
    quiz: [
      {
        id: 'q1',
        question: 'Why squash "fix typo" / "fix typo again" / "actually fix it" into one commit before opening a PR?',
        options: [
          'It\'s required by GitHub',
          'It presents one clean, reviewable change instead of the messy process that produced it',
          'It deletes the code changes',
          'It speeds up git clone',
        ],
        correctIndex: 1,
        explanation: 'Reviewers care about the final change, not your trial-and-error along the way — squashing tidies the story.',
      },
    ],
  },
]

export const MOD_06_LESSONS: Lesson[] = [
  {
    id: 'mod-06-lesson-01',
    moduleId: 'mod-06',
    type: 'video-quiz-sandbox',
    title: 'Shelving work with git stash',
    estimatedMinutes: 5,
    youtubeId: 'l2yrJtwoC_E',
    startSeconds: 300, // ESTIMATE
    endSeconds: 480,
    quiz: [
      {
        id: 'q1',
        question: 'You need to switch branches but aren\'t ready to commit your current work. What do you reach for?',
        options: ['git stash', 'git reset --hard', 'git rm -rf .', 'git clone'],
        correctIndex: 0,
        explanation: '`git stash` tucks away uncommitted changes so your working tree is clean, then `git stash pop` brings them back later.',
      },
    ],
    sandbox: {
      prompt: 'Stash your current changes, then bring them back.',
      expectedCommands: ['git stash'],
      hint: 'Type: git stash, then: git stash pop',
    },
  },
  {
    id: 'mod-06-lesson-02',
    moduleId: 'mod-06',
    type: 'video-quiz-sandbox',
    title: 'Cherry-picking a single commit',
    estimatedMinutes: 6,
    youtubeId: 'l2yrJtwoC_E',
    startSeconds: 720, // ESTIMATE
    endSeconds: 900,
    quiz: [
      {
        id: 'q1',
        question: 'What does `git cherry-pick <hash>` do?',
        options: [
          'Deletes that commit everywhere',
          'Applies just that one commit\'s changes onto your current branch',
          'Merges an entire branch',
          'Renames a commit',
        ],
        correctIndex: 1,
        explanation: 'Cherry-pick grabs one specific commit — handy for pulling a single fix without merging everything else on that branch.',
      },
    ],
    sandbox: {
      prompt: 'Check the log for a commit hash, then cherry-pick it onto your current branch.',
      expectedCommands: ['git cherry-pick'],
      hint: 'Type: git log --oneline to find a hash, then: git cherry-pick <hash>',
    },
  },
  {
    id: 'mod-06-lesson-03',
    moduleId: 'mod-06',
    type: 'video-quiz-sandbox',
    title: 'git revert vs. git reset',
    estimatedMinutes: 6,
    youtubeId: 'l2yrJtwoC_E',
    startSeconds: 1080, // ESTIMATE
    endSeconds: 1260,
    quiz: [
      {
        id: 'q1',
        question: 'Why is `git revert` safer than `git reset` on a branch other people are also using?',
        options: [
          'It isn\'t, they\'re equally risky',
          'Revert adds a new "undo" commit instead of rewriting history other people already have',
          'Revert only works on your own machine',
          'Reset is always the safer choice',
        ],
        correctIndex: 1,
        explanation: 'Revert preserves history (adds to it); reset rewrites it — rewriting shared history breaks other people\'s copies.',
      },
    ],
    sandbox: {
      prompt: 'Revert your most recent commit safely, without rewriting history.',
      expectedCommands: ['git revert'],
      hint: 'Type: git log --oneline to find the hash, then: git revert <hash>',
    },
  },
]

export const MOD_07_LESSONS: Lesson[] = [
  {
    id: 'mod-07-lesson-01',
    moduleId: 'mod-07',
    type: 'video-quiz-sandbox',
    title: 'Choosing a branching strategy',
    estimatedMinutes: 5,
    youtubeId: 'hNdrIIgK1rk',
    startSeconds: 180, // ESTIMATE
    endSeconds: 360,
    quiz: [
      {
        id: 'q1',
        question: 'Why do teams create a new branch per feature instead of everyone working on main?',
        options: [
          'It\'s required by Git itself',
          'It isolates unfinished, possibly-broken work from the stable, always-deployable main branch',
          'It makes commits smaller automatically',
          'There\'s no real benefit',
        ],
        correctIndex: 1,
        explanation: 'Isolation is the whole point — main stays safe to deploy from at any moment.',
      },
    ],
  },
  {
    id: 'mod-07-lesson-02',
    moduleId: 'mod-07',
    type: 'video-quiz-sandbox',
    title: 'Where merge conflicts come from',
    estimatedMinutes: 5,
    youtubeId: 'hNdrIIgK1rk',
    startSeconds: 540, // ESTIMATE
    endSeconds: 720,
    quiz: [
      {
        id: 'q1',
        question: 'What causes a merge conflict?',
        options: [
          'Using `git merge` at all',
          'Two branches changing the same lines of the same file in different ways',
          'Having more than two branches',
          'Forgetting to run `git status`',
        ],
        correctIndex: 1,
        explanation: 'Git can auto-merge non-overlapping changes fine — conflicts only happen when it genuinely can\'t tell which version you want.',
      },
    ],
    sandbox: {
      prompt: 'Create a second branch so you have two lines of work that could later conflict.',
      expectedCommands: ['git switch -c', 'git checkout -b'],
      hint: 'Type: git switch -c feature/conflict-practice',
    },
  },
  {
    id: 'mod-07-lesson-03',
    moduleId: 'mod-07',
    type: 'video-quiz-sandbox',
    title: 'Resolving a conflict and committing',
    estimatedMinutes: 6,
    youtubeId: 'hNdrIIgK1rk',
    startSeconds: 900, // ESTIMATE
    endSeconds: 1140,
    quiz: [
      {
        id: 'q1',
        question: 'After you\'ve manually fixed a conflicted file, what\'s the next step?',
        options: [
          'Delete the file',
          'Stage it with `git add`, then commit to complete the merge',
          'Run `git init` again',
          'Nothing — Git finishes automatically',
        ],
        correctIndex: 1,
        explanation: 'Editing the file resolves the conflict in your working directory — Git still needs `add` + `commit` to know you\'re done.',
      },
    ],
    sandbox: {
      prompt: 'Merge your branch into main to finish the workflow.',
      expectedCommands: ['git merge'],
      hint: 'Type: git switch main, then: git merge feature/conflict-practice',
    },
  },
]

/**
 * mod-08 is different in kind: GitHub Actions / CI-CD isn't something a
 * local git-command sandbox can meaningfully simulate (it's YAML + GitHub's
 * own servers, not git plumbing). These lessons are video + quiz only — no
 * `sandbox` field, so the lesson flow skips straight from quiz to complete.
 * See INTEGRATION.md.
 */
export const MOD_08_LESSONS: Lesson[] = [
  {
    id: 'mod-08-lesson-01',
    moduleId: 'mod-08',
    type: 'video-quiz-sandbox',
    title: 'What GitHub Actions automates',
    estimatedMinutes: 5,
    youtubeId: 'R8_veQiYBjI',
    startSeconds: 120, // ESTIMATE
    endSeconds: 300,
    quiz: [
      {
        id: 'q1',
        question: 'What triggers a GitHub Actions workflow?',
        options: [
          'Only a manual button click, nothing else',
          'Events like a push or a pull request, defined in the workflow file',
          'Nothing — it runs constantly in the background',
          'Only merges to main, never pushes',
        ],
        correctIndex: 1,
        explanation: 'You define the trigger yourself (push, PR, schedule, manual) in the workflow\'s `on:` block — nothing runs unless you configure it to.',
      },
    ],
  },
  {
    id: 'mod-08-lesson-02',
    moduleId: 'mod-08',
    type: 'video-quiz-sandbox',
    title: 'Anatomy of a workflow file',
    estimatedMinutes: 6,
    youtubeId: 'R8_veQiYBjI',
    startSeconds: 480, // ESTIMATE
    endSeconds: 720,
    quiz: [
      {
        id: 'q1',
        question: 'Where do GitHub Actions workflow files live in a repository?',
        options: ['/workflows/', '.github/workflows/', '/ci/', 'anywhere, path doesn\'t matter'],
        correctIndex: 1,
        explanation: 'GitHub specifically looks in `.github/workflows/*.yml` — outside that path, a YAML file is just a YAML file to GitHub.',
      },
    ],
  },
  {
    id: 'mod-08-lesson-03',
    moduleId: 'mod-08',
    type: 'video-quiz-sandbox',
    title: 'Reading a failed build',
    estimatedMinutes: 5,
    youtubeId: 'R8_veQiYBjI',
    startSeconds: 900, // ESTIMATE
    endSeconds: 1080,
    quiz: [
      {
        id: 'q1',
        question: 'A PR shows a red X on its Actions check. What\'s the right next step?',
        options: [
          'Merge anyway, it\'s probably fine',
          'Open the failed run\'s logs to see which step failed and why',
          'Delete the workflow file',
          'Force-push over the failure',
        ],
        correctIndex: 1,
        explanation: 'The logs tell you exactly which command failed and its output — almost always faster than guessing.',
      },
    ],
  },
]

export const ALL_LESSONS_BY_MODULE: Record<string, Lesson[]> = {
  'mod-00': [ACCOUNT_SETUP_LESSON],
  'mod-01': MOD_01_LESSONS,
  'mod-02': MOD_02_LESSONS,
  'mod-03': MOD_03_LESSONS,
  'mod-04': MOD_04_LESSONS,
  'mod-05': MOD_05_LESSONS,
  'mod-06': MOD_06_LESSONS,
  'mod-07': MOD_07_LESSONS,
  'mod-08': MOD_08_LESSONS,
}

export function getLessonsForModule(moduleId: string): Lesson[] {
  return ALL_LESSONS_BY_MODULE[moduleId] || []
}

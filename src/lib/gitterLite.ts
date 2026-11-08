/**
 * ============================================================================
 * gitterLite.ts
 * ============================================================================
 *
 * Rule-based fallback for Gitter — the default experience for every user.
 * Zero API calls, zero cost, no key or signup of any kind required.
 *
 * Matches a user's question against a curated set of common Git/GitHub
 * questions using simple keyword scoring (same idea as the error search
 * in TroubleshootSection). Users who want richer, real conversational
 * answers can optionally add their own free Gemini or Groq key to unlock
 * Gitter AI mode — see GitterHelper.tsx.
 * ============================================================================
 */

interface LiteEntry {
  keywords: string[]
  answer: string
}

const LITE_KNOWLEDGE: LiteEntry[] = [
  {
    keywords: ['not a git repository', 'not a git repo'],
    answer:
      "Git couldn't find a repository in the current folder. In the sandbox, start one with `git init`; on your computer, move into the project folder or initialize it with `git init`, then retry.",
  },
  {
    keywords: ['nothing to commit', 'changes not staged', 'no changes added to commit'],
    answer:
      "A commit records staged changes, and Git doesn't see any staged work yet. Check `git status`, then stage the intended files with `git add <file>` (or `git add .`) before committing.",
  },
  {
    keywords: ['pathspec', 'did not match any files', 'no such file'],
    answer:
      "Git couldn't find that path. Check the exact file name with `git status` and make sure the file exists; then retry `git add <file>` using the correct path.",
  },
  {
    keywords: ['no configured push destination', 'no push destination', 'remote add origin'],
    answer:
      "Git has no remote repository configured for this push. Add one with `git remote add origin <repository-url>`, then push your branch with `git push -u origin <branch>`.",
  },
  {
    keywords: ['unmerged files', 'resolve conflict', 'unresolved conflict'],
    answer:
      "Git is waiting for you to resolve the conflict before it can finish the merge. Edit each conflicted file, remove the conflict markers while keeping the intended content, stage it with `git add <file>`, then commit the merge.",
  },
  {
    keywords: ['invalid upstream', 'invalid reference', 'branch does not exist'],
    answer:
      "Git can't find that branch or reference. Check available branches with `git branch`; if you need a new branch, create it with `git switch -c <branch>`.",
  },
  {
    keywords: ['workflow validation', 'workflow path', 'github actions workflow', 'pull_request workflow', 'actions/checkout'],
    answer:
      "A GitHub Actions workflow needs to live under `.github/workflows/` and define an event under `on:` plus at least one job with steps. For a basic CI workflow, use `actions/checkout@v4`, set up the project as needed, then run its install and test commands.",
  },
  {
    keywords: ['what should i learn next', 'next module', 'what next', 'where do i start', 'where should i start'],
    answer:
      "Head to your dashboard — it always shows your next unfinished module based on your role path. If you're brand new, Module 1 (Git & GitHub Crash Course) is the best place to start.",
  },
  {
    keywords: ['merge conflict', 'conflict', 'both modified', 'fix conflicts'],
    answer:
      "A merge conflict happens when two branches change the same lines. Git pauses and asks you to pick the final version — open the file, look for <<<<<<< markers, keep what you want, then `git add` and commit. Module 7 walks through this with real examples.",
  },
  {
    keywords: ['rebase', 'rebasing'],
    answer:
      "Rebasing rewrites your branch's history onto a new base commit — great for a clean, linear history before opening a PR. Rule of thumb: never rebase a branch other people are also working on. Module 5 covers this in depth.",
  },
  {
    keywords: ['pull request', 'open a pr', 'pr review', 'pr for the first time'],
    answer:
      "A pull request proposes merging your branch into another (usually main). Push your branch, open the PR on GitHub, describe what changed and why, and request review. Module 4 has a full walkthrough of writing great PRs.",
  },
  {
    keywords: ['revert', 'undo commit', 'undo a commit', 'undo my last commit'],
    answer:
      "`git revert <commit>` creates a new commit that undoes the changes — safe for shared branches since it doesn't rewrite history. `git reset` rewrites history and is riskier once pushed. Module 1 covers safe undos.",
  },
  {
    keywords: ['stash', 'stashing'],
    answer:
      "`git stash` temporarily shelves uncommitted changes so you can switch branches cleanly, then `git stash pop` brings them back. Handy when you need to pull or switch branches mid-work.",
  },
  {
    keywords: ['ci/cd', 'ci cd', 'github actions', 'automation', 'pipeline', 'deploy automatically'],
    answer:
      "GitHub Actions runs workflows (build, test, deploy) automatically on events like a push or PR. You define them in `.github/workflows/*.yml`. Module 8 builds one from scratch.",
  },
  {
    keywords: ['career', 'interview', 'portfolio', 'job', 'resume', 'cv'],
    answer:
      "For interviews, be ready to talk through a real merge conflict you resolved, why you chose rebase vs merge, and how you structure commits/PRs. Your GitHub profile and weekly challenge history in Career Mode are good talking points too.",
  },
  {
    keywords: ['detached head', 'not currently on a branch'],
    answer:
      "Detached HEAD means you checked out a specific commit instead of a branch — new commits won't belong to any branch yet. Run `git switch -c some-branch-name` to save your work onto a real branch.",
  },
  {
    keywords: ['force push', 'push -f', 'force-push', 'force with lease'],
    answer:
      "Force-pushing overwrites remote history — use it only on your own feature branches, never on `main` or shared branches, since it can erase others' work. `--force-with-lease` is a safer variant that checks nothing unexpected got overwritten first.",
  },
  {
    keywords: ['clone', 'cloning', 'clone a repo'],
    answer:
      "`git clone <url>` downloads a full copy of a repository, including its history, onto your machine. After cloning, `cd` into the folder and you're ready to branch and commit. Module 1 covers first-time setup.",
  },
  {
    keywords: ['branch', 'branching', 'create a branch', 'new branch'],
    answer:
      "`git switch -c my-feature` creates and switches to a new branch in one step. Branches let you work on changes in isolation before merging them back into main. Module 2 covers branching basics.",
  },
  {
    keywords: ['commit message', 'good commit', 'commit messages'],
    answer:
      "Good commit messages are short, present-tense, and specific — e.g. \"Fix login redirect on expired session\" rather than \"fix stuff\". Keep the subject line under ~50 characters and add detail in the body if needed.",
  },
  {
    keywords: ['fork', 'forking', 'contribute to open source', 'open source'],
    answer:
      "Forking makes your own copy of someone else's repo on GitHub. Clone your fork, make changes on a branch, push, then open a pull request back to the original repo. Module 5 covers open-source contribution flow.",
  },
  {
    keywords: ['gitignore', 'ignore files', '.gitignore'],
    answer:
      "A `.gitignore` file lists patterns (like `node_modules/` or `.env`) that Git should never track or commit. Add it at the root of your repo before your first commit if possible.",
  },
  {
    keywords: ['ssh key', 'ssh', 'authentication', 'permission denied publickey'],
    answer:
      "SSH keys let you authenticate with GitHub without typing a password every time. Generate one with `ssh-keygen`, then add the public key to your GitHub account under Settings → SSH and GPG keys. Module 2 walks through this.",
  },
  {
    keywords: ['squash', 'squashing', 'squash commits'],
    answer:
      "Squashing combines multiple commits into one, which is great for tidying up a messy feature branch before merging. `git rebase -i HEAD~n` lets you pick commits to squash. Module 5 covers this alongside rebasing.",
  },
  {
    keywords: ['cherry pick', 'cherry-pick'],
    answer:
      "`git cherry-pick <commit>` applies one specific commit from another branch onto your current branch — useful for pulling in a single fix without merging everything else. Module 6 covers this and other advanced tools.",
  },
]

const FALLBACK_ANSWER =
  "I'm running in free Gitter Lite mode, so I know common Git questions and errors but may not have that exact answer. Try the Fix an Error search page, or optionally add your own Gemini or Groq key in settings for AI chat."

/**
 * Scores and returns the best matching canned answer for a free-text
 * question. Falls back to a friendly "outside my list" message.
 */
export function answerWithGitterLite(question: string): string {
  const q = question.toLowerCase()
  let best: { entry: LiteEntry; score: number } | null = null

  for (const entry of LITE_KNOWLEDGE) {
    const score = entry.keywords.reduce((sum, kw) => sum + (q.includes(kw) ? kw.length : 0), 0)
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }

  return best ? best.entry.answer : FALLBACK_ANSWER
}

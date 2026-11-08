import type { SandboxTask } from '../content/lessons'

export interface CommandFailureFeedback {
  reason: string
  retryHint: string
}

export function explainCommandFailure(output: string[]): CommandFailureFeedback | null {
  const message = output.find(line =>
    /^(?:fatal:|error:|command not found:|git: .* is not supported in this sandbox yet\.|nothing to commit|No local changes to save|No stash entries found)/i.test(line)
  )
  if (!message) return null

  if (message.includes('not a git repository')) {
    return { reason: 'Git commands need to run inside an initialized repository.', retryHint: 'Run `git init` first, then retry your command.' }
  }
  if (message.startsWith('command not found:')) {
    return { reason: 'This sandbox accepts Git commands, not general shell commands.', retryHint: 'Use the Git command shown in the lesson hint.' }
  }
  if (message.includes('is not supported in this sandbox yet')) {
    return { reason: 'This simulator does not implement that Git command yet, so it cannot model the result accurately.', retryHint: 'Use a supported command from the lesson hint instead.' }
  }
  if (message.includes('pathspec')) {
    return { reason: 'Git could not find that file in the sandbox.', retryHint: 'Create or clone a file first, then check its exact name with `git status`.' }
  }
  if (message.includes('nothing to commit')) {
    return { reason: 'A commit only records changes that have been staged.', retryHint: 'Make or add a file, stage it with `git add`, then commit.' }
  }
  if (message.includes('nothing specified') || message.includes('nothing to add')) {
    return { reason: '`git add` needs a file name or `.` to stage all files.', retryHint: 'Try `git add README.md` or `git add .`.' }
  }
  if (message.includes('before switching branches')) {
    return { reason: 'Switching now could carry uncommitted changes into another branch.', retryHint: 'Commit or stash your changes, then switch branches.' }
  }
  if (message.includes('invalid reference') || message.includes('invalid upstream')) {
    return { reason: 'That branch does not exist in this repository yet.', retryHint: 'Create it with `git switch -c <branch>` or check the spelling with `git branch`.' }
  }
  if (message.includes('No configured push destination')) {
    return { reason: 'Git has no remote repository configured to receive the push.', retryHint: 'Add a remote with `git remote add origin <url>`, then push.' }
  }
  if (message.includes('remote URL required')) {
    return { reason: 'A remote needs both a name and a repository URL.', retryHint: 'Use `git remote add origin https://github.com/you/repo.git`.' }
  }
  if (message.includes('unmerged files')) {
    return { reason: 'Git will not create a commit until every conflicted file has been resolved and staged.', retryHint: 'Choose a version in the conflict panel, then run `git commit -m "Resolve conflict"`.' }
  }
  if (message.includes('No local changes') || message.includes('No stash entries')) {
    return { reason: 'There are no saved changes for this stash operation.', retryHint: 'Create a change before `git stash`, or stash changes before `git stash pop`.' }
  }

  return { reason: message, retryHint: 'Read the Git message, adjust the command or repository state, then try again.' }
}

export function getSequenceProgress(
  history: Array<{ cmd: string; output: string[] }>,
  task: SandboxTask,
): { completed: number; total: number; nextCommand?: string } | null {
  const sequences = task.expectedCommandSequences ?? []
  if (sequences.length === 0) return null

  const successful = (entry: { cmd: string; output: string[] }) =>
    explainCommandFailure(entry.output) === null
  const matches = (actual: string, expected: string) => {
    const command = actual.trim().replace(/\s+/g, ' ')
    const pattern = expected.trim().replace(/\s+/g, ' ')
    return command === pattern || command.startsWith(`${pattern} `)
  }

  const progress = sequences.map(sequence => {
    let completed = 0
    for (const entry of history) {
      if (successful(entry) && matches(entry.cmd, sequence[completed])) completed++
      if (completed === sequence.length) break
    }
    return { completed, total: sequence.length, nextCommand: sequence[completed] }
  }).sort((a, b) => b.completed - a.completed)[0]

  return progress ?? null
}

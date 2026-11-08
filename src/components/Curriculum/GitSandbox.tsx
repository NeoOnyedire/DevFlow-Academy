/**
 * ============================================================================
 * GitSandbox.tsx
 * ============================================================================
 *
 * A real interactive Git terminal — not a fake one that just checks
 * string equality against an expected answer. This maintains an actual
 * in-memory repo model (files, staging area, commits, branches, HEAD)
 * and interprets a working subset of real Git commands against it, so
 * mistakes behave like mistakes (e.g. `git commit` with nothing staged
 * really does say "nothing to commit") and success genuinely changes
 * the visible repo state.
 *
 * Supported commands (enough to cover every sandbox task in
 * src/content/lessons.ts, extend this list as later modules need more):
 *   git init
 *   git status
 *   git add <file> | git add .
 *   git commit -m "<message>"
 *   git branch [<name>]
 *   git switch <branch> | git switch -c <branch>
 *   git checkout <branch> | git checkout -b <branch>
 *   git merge <branch>
 *   git log [--oneline]
 *
 * This is intentionally a simulator, not a WASM git binary — it's meant
 * to teach the mental model (staging area, commits, branch pointers)
 * safely and instantly, not to be a full terminal replacement. New file
 * creation is a UI affordance (a button), not a shell command, since
 * `touch`/`echo >` are outside Git itself.
 *
 * This is the fully-scoped version of the roadmap's "Interactive Git
 * Sandbox" item — reusable outside the curriculum too (e.g. the standalone
 * Practice page), not just as a lesson step.
 *
 * THEME: the terminal is a dark surface in every theme (term-* classes use
 * fixed light text); the surrounding panel, chips, headings and hint use
 * the curriculum classes (cur-*) so they follow Original / Light / Dark.
 * ============================================================================
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal, FilePlus, CheckCircle2, GitBranch as BranchIcon, MessageCircle } from 'lucide-react'
import type { SandboxTask } from '../../content/lessons'
import { createMergeCommit, getCommitHistory, getMergeDisposition, type BranchRefs, type GitCommit } from '../../lib/gitGraph'
import { explainCommandFailure, getSequenceProgress } from '../../lib/learningFeedback'
import { requestGitterHelp } from '../../lib/gitterSupport'

type Commit = GitCommit

interface RepoState {
  initialized: boolean
  files: Record<string, { staged: boolean; committed: boolean }>
  commits: Commit[]
  branches: BranchRefs
  currentBranch: string
  headCommitHash: string | null
  config: { name: string | null; email: string | null }
  remote: string | null
  mergeConflict: boolean
  mergeTargetHash: string | null
  /** Snapshot of `files` taken by `git stash`, restored by `git stash pop`. */
  stashSnapshot: Record<string, { staged: boolean; committed: boolean }> | null
}

const INITIAL_STATE: RepoState = {
  initialized: false,
  files: {},
  commits: [],
  branches: { main: null },
  currentBranch: 'main',
  headCommitHash: null,
  config: { name: null, email: null },
  remote: null,
  mergeConflict: false,
  mergeTargetHash: null,
  stashSnapshot: null,
}

const MERGE_CONFLICT_STATE: RepoState = {
  initialized: true,
  files: { 'README.md': { staged: false, committed: true } },
  commits: [
    { hash: 'base123', message: 'Add README', parentHash: null, branch: 'main', files: ['README.md'], snapshot: ['README.md'] },
    { hash: 'main789', message: 'Update README on main', parentHash: 'base123', branch: 'main', files: ['README.md'], snapshot: ['README.md'] },
    { hash: 'feat456', message: 'Update README on feature', parentHash: 'base123', branch: 'feature/conflict-practice', files: ['README.md'], snapshot: ['README.md'] },
  ],
  branches: { main: 'main789', 'feature/conflict-practice': 'feat456' },
  currentBranch: 'main',
  headCommitHash: 'main789',
  config: { name: null, email: null },
  remote: null,
  mergeConflict: false,
  mergeTargetHash: null,
  stashSnapshot: null,
}

function shortHash(): string {
  return Math.random().toString(16).slice(2, 9)
}

interface Props {
  task: SandboxTask
  onSolved: () => void
}

export default function GitSandbox({ task, onSolved }: Props) {
  const [repo, setRepo] = useState<RepoState>(() =>
    task.scenario === 'merge-conflict' ? MERGE_CONFLICT_STATE : INITIAL_STATE
  )
  const [history, setHistory] = useState<{ cmd: string; output: string[] }[]>([])
  const [input, setInput] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [solved, setSolved] = useState(false)
  const latestEntry = history[history.length - 1]
  const commandFeedback = latestEntry ? explainCommandFailure(latestEntry.output) : null
  const sequenceProgress = getSequenceProgress(history, task)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const checkSolved = useCallback((cmd: string, output: string[]) => {
    const entries = [...history, { cmd, output }]
    const commandMatches = (actual: string, expected: string) => {
      const normalized = actual.trim().replace(/\s+/g, ' ')
      const prefix = expected.trim().replace(/\s+/g, ' ')
      return normalized === prefix || normalized.startsWith(`${prefix} `)
    }
    const succeeded = (entry: { cmd: string; output: string[] }) =>
      explainCommandFailure(entry.output) === null
    const matchesSequence = (sequence: string[]) => {
      let next = 0
      for (const entry of entries) {
        if (succeeded(entry) && commandMatches(entry.cmd, sequence[next])) next++
        if (next === sequence.length) return true
      }
      return false
    }
    const sequences = task.expectedCommandSequences ?? []
    const isMatch = sequences.length > 0
      ? sequences.some(matchesSequence)
      : task.expectedCommands.some(expected =>
        entries.some(entry => succeeded(entry) && commandMatches(entry.cmd, expected))
      )
    const hasRequiredFiles = (task.requiredFiles ?? []).every(name => name in repo.files)
    if (isMatch && hasRequiredFiles) {
      setSolved(true)
      onSolved()
    }
  }, [history, task, onSolved, repo.files])

  const addNewFile = () => {
    const name = newFileName.trim()
    if (!name) return
    setRepo(prev => ({
      ...prev,
      files: { ...prev.files, [name]: { staged: false, committed: false } },
    }))
    setNewFileName('')
    setHistory(prev => [...prev, { cmd: `# created ${name}`, output: [`Created ${name} in the working directory.`] }])
  }

  const runCommand = (raw: string) => {
    const cmd = raw.trim()
    if (!cmd) return
    const output = interpret(cmd, repo, setRepo, task.scenario)
    setHistory(prev => [...prev, { cmd, output }])
    checkSolved(cmd, output)
    setInput('')
  }

  const resolveConflict = (version: 'main' | 'feature') => {
    setRepo(prev => ({
      ...prev,
      mergeConflict: false,
      files: { ...prev.files, 'README.md': { staged: true, committed: false } },
    }))
    setHistory(prev => [...prev, {
      cmd: `# kept ${version} version of README.md`,
      output: [`Resolved README.md using the ${version} version and staged it.`],
    }])
  }

  const untracked = Object.entries(repo.files).filter(([, f]) => !f.staged && !f.committed).map(([n]) => n)
  const staged = Object.entries(repo.files).filter(([, f]) => f.staged).map(([n]) => n)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-[#3CCF4A] text-[#173A1B]">
          Sandbox
        </span>
        {solved && (
          <span className="flex items-center gap-1 text-xs font-accent uppercase tracking-wider cur-success-text">
            <CheckCircle2 className="w-3.5 h-3.5" /> Solved
          </span>
        )}
      </div>

      <h4 className="font-display font-bold text-xl mb-2 cur-text">Your turn</h4>
      <p className="text-sm mb-4 cur-text-soft">{task.prompt}</p>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Terminal — always dark */}
        <div className="cur-terminal rounded-xl overflow-hidden flex flex-col" style={{ height: 320 }}>
          <div className="term-bar flex items-center gap-2 px-3 py-2 border-b" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <Terminal className="w-3.5 h-3.5 term-dim" />
            <span className="text-xs font-mono term-dim">sandbox — {repo.currentBranch}</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-2">
            {history.length === 0 && (
              <p className="term-dim">Type a git command below and press Enter.</p>
            )}
            {history.map((entry, i) => (
              <div key={i}>
                <p className="term-prompt">$ {entry.cmd}</p>
                {entry.output.map((line, j) => (
                  <p key={j} className="term-out pl-2 whitespace-pre-wrap">{line}</p>
                ))}
              </div>
            ))}
          </div>
          <div className="term-bar flex items-center gap-2 border-t px-3 py-2">
            <span className="term-prompt font-mono text-xs">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runCommand(input) }}
              className="term-input flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-[rgba(255,255,255,0.28)]"
              placeholder="git status"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Repo state panel */}
        <div className="cur-card rounded-xl p-4 space-y-4">
          {repo.mergeConflict && (
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
              <p className="text-sm font-semibold cur-text">Resolve README.md conflict</p>
              <p className="text-xs mt-1 mb-3 cur-text-soft">Choose which version to keep. Git will stage the resolved file for the merge commit.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => resolveConflict('main')} className="cur-btn rounded-lg px-3 py-1.5 text-xs">
                  Keep main version
                </button>
                <button onClick={() => resolveConflict('feature')} className="cur-btn rounded-lg px-3 py-1.5 text-xs">
                  Keep feature version
                </button>
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-accent uppercase tracking-wider mb-2 cur-text-faint">New file (working dir only)</p>
            <div className="flex gap-2">
              <input
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addNewFile() }}
                placeholder="README.md"
                className="cur-card cur-text min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#F7B731]"
              />
              <button onClick={addNewFile} aria-label="Create file"
                className="cur-btn rounded-lg px-2.5 py-1.5 hover:opacity-90 transition-opacity">
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-accent uppercase tracking-wider mb-1.5 cur-text-faint">Working directory</p>
            {untracked.length === 0 ? <p className="text-xs cur-text-faint">Nothing untracked.</p> : (
              <div className="flex flex-wrap gap-1.5">
                {untracked.map(f => <span key={f} className="cur-track cur-text-soft px-2 py-0.5 rounded text-[11px]">{f}</span>)}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-accent uppercase tracking-wider mb-1.5 cur-text-faint">Staged</p>
            {staged.length === 0 ? <p className="text-xs cur-text-faint">Nothing staged.</p> : (
              <div className="flex flex-wrap gap-1.5">
                {staged.map(f => <span key={f} className="cur-pill px-2 py-0.5 rounded text-[11px]">{f}</span>)}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5 cur-text-faint">
              <BranchIcon className="w-3 h-3" /> Commit graph
            </p>
            {repo.commits.length === 0 ? <p className="text-xs cur-text-faint">No commits yet.</p> : (
              <div className="space-y-1.5">
                {getCommitHistory(repo.headCommitHash, repo.commits).map(c => (
                  <div key={c.hash} className="flex items-center gap-2 text-xs">
                    <span className="font-mono cur-link">{c.hash}</span>
                    <span className="truncate cur-text-soft">{c.message}</span>
                    <span className="ml-auto cur-text-faint">
                      {Object.entries(repo.branches)
                        .filter(([, hash]) => hash === c.hash)
                        .map(([name]) => name)
                        .join(', ')}
                      {repo.headCommitHash === c.hash && ' · HEAD'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!solved && (
            <div className="pt-2" style={{ borderTop: '1px solid var(--cur-border)' }}>
              {commandFeedback && (
                <div role="status" className="mb-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3">
                  <p className="text-xs font-semibold cur-text">Why it didn’t work</p>
                  <p className="text-xs mt-1 cur-text-soft">{commandFeedback.reason}</p>
                  <p className="text-xs mt-1 cur-text-soft">Try next: {commandFeedback.retryHint}</p>
                  <button
                    onClick={() => requestGitterHelp(
                      `I'm using the Git sandbox. Task: ${task.prompt}. I ran "${latestEntry?.cmd}" and got: ${latestEntry?.output.join(' ')}. Explain what happened and how to fix it.`
                    )}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold cur-link hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Ask Gitter for help (Lite is free)
                  </button>
                </div>
              )}
              {sequenceProgress && sequenceProgress.completed < sequenceProgress.total && (
                <p className="text-xs mb-2 cur-text-soft">
                  Progress: {sequenceProgress.completed} of {sequenceProgress.total} steps. Next: <code>{sequenceProgress.nextCommand}</code>
                </p>
              )}
              <p className="text-xs cur-text-faint">Hint: {task.hint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Interprets one command line against the repo state, returns terminal output lines. */
function interpret(
  cmd: string,
  repo: RepoState,
  setRepo: (updater: (prev: RepoState) => RepoState) => void,
  scenario?: SandboxTask['scenario'],
): string[] {
  const parts = cmd.split(' ')
  if (parts[0] !== 'git') return [`command not found: ${parts[0]}`]

  const sub = parts[1]

  if (sub === 'init') {
    setRepo(prev => ({ ...prev, initialized: true }))
    return ['Initialized empty Git repository in ./sandbox/.git/']
  }

  if (!repo.initialized) return ['fatal: not a git repository (run `git init` first)']

  if (sub === 'status') {
    const untracked = Object.entries(repo.files).filter(([, f]) => !f.staged && !f.committed).map(([n]) => n)
    const staged = Object.entries(repo.files).filter(([, f]) => f.staged).map(([n]) => n)
    const lines = [`On branch ${repo.currentBranch}`]
    if (repo.mergeConflict) {
      lines.push('You have unmerged paths:', '  (fix conflicts and run "git commit")')
    }
    if (staged.length) lines.push('Changes to be committed:', ...staged.map(f => `  new file:   ${f}`))
    if (untracked.length) lines.push('Untracked files:', ...untracked.map(f => `  ${f}`))
    if (!staged.length && !untracked.length) lines.push('nothing to commit, working tree clean')
    return lines
  }

  if (sub === 'add') {
    const target = parts[2]
    if (!target) return ['fatal: nothing specified, nothing added.']
    if (target !== '.' && !repo.files[target]) {
      return [`fatal: pathspec '${target}' did not match any files`]
    }
    if (target === '.' && Object.keys(repo.files).length === 0) {
      return ['fatal: nothing to add']
    }
    setRepo(prev => {
      const files = { ...prev.files }
      const names = target === '.' ? Object.keys(files) : [target]
      for (const name of names) {
        if (files[name]) files[name] = { ...files[name], staged: true }
      }
      return { ...prev, files }
    })
    return [target === '.' ? 'Staged all changes.' : `Staged ${target}.`]
  }

  if (sub === 'commit') {
    if (repo.mergeConflict) return ['fatal: cannot commit because you have unmerged files']
    const staged = Object.entries(repo.files).filter(([, f]) => f.staged).map(([n]) => n)
    if (staged.length === 0) return ['nothing to commit, working tree clean']
    const messageMatch = cmd.match(/-m\s+"([^"]+)"/)
    const message = messageMatch ? messageMatch[1] : '(no message provided — use -m "message")'
    if (!messageMatch) return ['error: switch `m` requires a value — try: git commit -m "your message"']
    const hash = shortHash()
    setRepo(prev => {
      const files = { ...prev.files }
      staged.forEach(name => { files[name] = { staged: false, committed: true } })
      const commit: Commit = prev.mergeTargetHash && prev.headCommitHash
        ? {
          ...createMergeCommit(prev.currentBranch, prev.headCommitHash, prev.mergeTargetHash, hash, staged),
          snapshot: Object.keys(files),
        }
        : {
          hash,
          message,
          parentHash: prev.headCommitHash,
          branch: prev.currentBranch,
          files: staged,
          snapshot: Object.keys(files),
        }
      return {
        ...prev,
        files,
        commits: [...prev.commits, commit],
        branches: { ...prev.branches, [prev.currentBranch]: hash },
        headCommitHash: hash,
        mergeTargetHash: null,
      }
    })
    return [`[${repo.currentBranch} ${hash}] ${message}`, `${staged.length} file(s) changed`]
  }

  if (sub === 'branch') {
    const name = parts[2]
    if (!name) return Object.keys(repo.branches).map(b => (b === repo.currentBranch ? `* ${b}` : `  ${b}`))
    if (name in repo.branches) return [`fatal: a branch named '${name}' already exists`]
    setRepo(prev => ({ ...prev, branches: { ...prev.branches, [name]: prev.headCommitHash } }))
    return [`Branch '${name}' created.`]
  }

  if (sub === 'switch' || sub === 'checkout') {
    const creating = parts[2] === '-c' || parts[2] === '-b'
    const name = creating ? parts[3] : parts[2]
    if (!name) return ['fatal: missing branch name']
    if (creating) {
      if (name in repo.branches) return [`fatal: a branch named '${name}' already exists`]
      setRepo(prev => ({
        ...prev,
        branches: { ...prev.branches, [name]: prev.headCommitHash },
        currentBranch: name,
      }))
      return [`Switched to a new branch '${name}'`]
    }
    if (!(name in repo.branches)) return [`fatal: invalid reference: ${name}`]
    if (repo.mergeConflict || repo.mergeTargetHash) return ['fatal: cannot switch branches during a merge']
    if (Object.values(repo.files).some(file => file.staged || !file.committed)) {
      return ['error: commit or stash your changes before switching branches']
    }
    setRepo(prev => ({
      ...prev,
      currentBranch: name,
      headCommitHash: prev.branches[name],
      files: Object.fromEntries(
        (prev.commits.find(commit => commit.hash === prev.branches[name])?.snapshot ?? [])
          .map(file => [file, { staged: false, committed: true }]),
      ),
    }))
    return [`Switched to branch '${name}'`]
  }

  if (sub === 'merge') {
    const name = parts[2]
    if (!name) return ['fatal: missing branch name to merge']
    if (!(name in repo.branches)) return [`fatal: invalid reference: ${name}`]
    if (repo.mergeConflict || repo.mergeTargetHash) return ['fatal: a merge is already in progress']
    if (scenario === 'merge-conflict' && name === 'feature/conflict-practice') {
      setRepo(prev => ({ ...prev, mergeConflict: true, mergeTargetHash: prev.branches[name] }))
      return [
        'Auto-merging README.md',
        'CONFLICT (content): Merge conflict in README.md',
        'Automatic merge failed; fix conflicts and then commit the result.',
      ]
    }
    const sourceHash = repo.branches[name]
    const disposition = getMergeDisposition(repo.headCommitHash, sourceHash, repo.commits)
    if (disposition === 'already-up-to-date') return ['Already up to date.']
    if (disposition === 'fast-forward' && sourceHash) {
      setRepo(prev => ({
        ...prev,
        branches: { ...prev.branches, [prev.currentBranch]: sourceHash },
        headCommitHash: sourceHash,
        files: Object.fromEntries(
          (prev.commits.find(commit => commit.hash === sourceHash)?.snapshot ?? [])
            .map(file => [file, { staged: false, committed: true }]),
        ),
      }))
      return [`Updating ${repo.headCommitHash?.slice(0, 7) ?? '0000000'}..${sourceHash.slice(0, 7)}`, `Fast-forward ${repo.currentBranch} to ${name}.`]
    }
    if (!repo.headCommitHash || !sourceHash) return ['fatal: refusing to merge unrelated histories']

    const hash = shortHash()
    const currentFiles = repo.commits.find(commit => commit.hash === repo.headCommitHash)?.snapshot ?? []
    const sourceFiles = repo.commits.find(commit => commit.hash === sourceHash)?.snapshot ?? []
    const mergeCommit = createMergeCommit(
      repo.currentBranch,
      repo.headCommitHash,
      sourceHash,
      hash,
      [...new Set([...currentFiles, ...sourceFiles])],
    )
    mergeCommit.snapshot = [...new Set([...currentFiles, ...sourceFiles])]
    const files = Object.fromEntries(
      mergeCommit.snapshot.map(file => [file, { staged: false, committed: true }]),
    )
    setRepo(prev => ({
      ...prev,
      commits: [...prev.commits, mergeCommit],
      branches: { ...prev.branches, [prev.currentBranch]: hash },
      headCommitHash: hash,
      files,
    }))
    return [`Merge made by the 'ort' strategy.`, `[${repo.currentBranch} ${hash}] ${mergeCommit.message}`]
  }

  if (sub === 'log') {
    if (repo.commits.length === 0) return ['fatal: your current branch has no commits yet']
    return [...repo.commits].reverse().map(c => (parts.includes('--oneline') ? `${c.hash} ${c.message}` : `commit ${c.hash}\n    ${c.message}`))
  }

  if (sub === 'config') {
    // git config user.name "X" / user.email "X"
    const key = parts[2]
    const valueMatch = cmd.match(/"([^"]+)"/)
    if (!key || !valueMatch) return ['usage: git config user.name "Your Name"']
    setRepo(prev => ({
      ...prev,
      config: key === 'user.email' ? { ...prev.config, email: valueMatch[1] } : { ...prev.config, name: valueMatch[1] },
    }))
    return [`Set ${key} = ${valueMatch[1]}`]
  }

  if (sub === 'clone') {
    if (!parts[2]) return ['fatal: repository URL required']
    // Simulated network op — seeds a small, already-committed starter repo.
    const hash = shortHash()
    const commit: Commit = {
      hash,
      message: 'Initial commit',
      parentHash: null,
      branch: 'main',
      files: ['README.md', 'index.html'],
      snapshot: ['README.md', 'index.html'],
    }
    setRepo(prev => ({
      ...prev,
      initialized: true,
      files: { 'README.md': { staged: false, committed: true }, 'index.html': { staged: false, committed: true } },
      commits: [commit],
      branches: { main: hash },
      currentBranch: 'main',
      headCommitHash: hash,
      mergeConflict: false,
      mergeTargetHash: null,
    }))
    return ['Cloning into \'sample-repo\'...', 'remote: Enumerating objects, done.', 'Receiving objects: 100%, done.']
  }

  if (sub === 'remote') {
    const name = parts[3]
    if (parts[2] === 'add' && name) {
      if (!parts[4]) return ['fatal: remote URL required']
      setRepo(prev => ({ ...prev, remote: name }))
      return [`Remote '${parts[3]}' added.`]
    }
    return repo.remote ? [`origin\t${repo.remote} (fetch)`, `origin\t${repo.remote} (push)`] : ['(no remotes configured)']
  }

  if (sub === 'push') {
    if (!repo.remote) return ['fatal: No configured push destination — run `git remote add origin <url>` first.']
    return [`Enumerating objects, done.`, `To ${repo.remote}`, `   ${repo.currentBranch} -> ${repo.currentBranch}`]
  }

  if (sub === 'fetch') {
    return ['From ' + (repo.remote || 'origin'), 'Already up to date.']
  }

  if (sub === 'pull') {
    return ['Already up to date.']
  }

  if (sub === 'rm') {
    const target = parts[2]
    if (!target || !repo.files[target]) return [`fatal: pathspec '${target}' did not match any files`]
    setRepo(prev => {
      const files = { ...prev.files }
      delete files[target]
      return { ...prev, files }
    })
    return [`rm '${target}'`]
  }

  if (sub === 'restore') {
    const staged = parts[2] === '--staged'
    const target = staged ? parts[3] : parts[2]
    if (!target) return ['error: missing pathspec']
    if (!repo.files[target]) {
      const trackedInHistory = repo.commits.some(commit => commit.files.includes(target))
      if (!trackedInHistory || staged) return [`error: pathspec '${target}' did not match any file(s) known to git`]
      setRepo(prev => ({
        ...prev,
        files: { ...prev.files, [target]: { staged: false, committed: true } },
      }))
      return [`Restored '${target}' from the last commit.`]
    }
    setRepo(prev => ({
      ...prev,
      files: { ...prev.files, [target]: { ...prev.files[target], staged: false } },
    }))
    return staged ? [`Unstaged changes to ${target}`] : [`Discarded changes in ${target}`]
  }

  if (sub === 'reset') {
    if (repo.commits.length === 0) return ['fatal: your current branch has no commits yet']
    const hard = cmd.includes('--hard')
    setRepo(prev => {
      const undone = prev.commits.find(commit => commit.hash === prev.headCommitHash)
      if (!undone) return prev
      const parent = prev.commits.find(commit => commit.hash === undone.parentHash)
      let files = { ...prev.files }
      if (!hard) {
        undone.files.forEach(name => { if (files[name]) files[name] = { ...files[name], committed: false, staged: true } })
      } else {
        files = Object.fromEntries(
          (parent?.snapshot ?? []).map(name => [name, { staged: false, committed: true }]),
        )
      }
      const headCommitHash = undone.parentHash
      return {
        ...prev,
        headCommitHash,
        branches: { ...prev.branches, [prev.currentBranch]: headCommitHash },
        files,
      }
    })
    return hard
      ? ['HEAD is now at previous commit — working tree changes discarded.']
      : ['HEAD is now at previous commit — changes kept and staged.']
  }

  if (sub === 'diff') {
    const staged = Object.entries(repo.files).filter(([, f]) => f.staged).map(([n]) => n)
    const untracked = Object.entries(repo.files).filter(([, f]) => !f.staged && !f.committed).map(([n]) => n)
    if (staged.length === 0 && untracked.length === 0) return ['(no differences — working tree matches last commit)']
    return ['diff --git a/file b/file', ...[...staged, ...untracked].map(f => `+++ ${f} (modified)`)]
  }

  if (sub === 'stash') {
    if (parts[2] === 'pop') {
      if (!repo.stashSnapshot) return ['No stash entries found.']
      setRepo(prev => ({ ...prev, files: prev.stashSnapshot!, stashSnapshot: null }))
      return ['Dropped stash, changes restored to your working directory.']
    }
    const hasChanges = Object.values(repo.files).some(f => f.staged || !f.committed)
    if (!hasChanges) return ['No local changes to save']
    setRepo(prev => {
      const snapshot = { ...prev.files }
      const cleared: RepoState['files'] = {}
      Object.entries(prev.files).forEach(([name, f]) => { if (f.committed) cleared[name] = { staged: false, committed: true } })
      return { ...prev, files: cleared, stashSnapshot: snapshot }
    })
    return ['Saved working directory and index state WIP on ' + repo.currentBranch]
  }

  if (sub === 'revert') {
    const hash = parts[2]
    const target = repo.commits.find(c => c.hash === hash)
    if (!target) return [`fatal: bad revision '${hash}' — check \`git log\` for a valid hash`]
    const newHash = shortHash()
    setRepo(prev => ({
      ...prev,
      commits: [...prev.commits, {
        hash: newHash,
        message: `Revert "${target.message}"`,
        parentHash: prev.headCommitHash,
        branch: prev.currentBranch,
        files: target.files,
        snapshot: Object.keys(prev.files),
      }],
      branches: { ...prev.branches, [prev.currentBranch]: newHash },
      headCommitHash: newHash,
    }))
    return [`[${repo.currentBranch} ${newHash}] Revert "${target.message}"`]
  }

  if (sub === 'rebase') {
    const target = parts[2]
    if (!target) return ['usage: git rebase <branch>']
    if (!(target in repo.branches) || !repo.branches[target]) return [`fatal: invalid upstream '${target}'`]
    return [`Successfully rebased and updated refs/heads/${repo.currentBranch}.`]
  }

  if (sub === 'cherry-pick') {
    const hash = parts[2]
    const source = repo.commits.find(c => c.hash === hash)
    if (!source) return [`fatal: bad revision '${hash}' — check \`git log\` for a valid hash`]
    const newHash = shortHash()
    setRepo(prev => ({
      ...prev,
      commits: [...prev.commits, {
        hash: newHash,
        message: source.message,
        parentHash: prev.headCommitHash,
        branch: prev.currentBranch,
        files: source.files,
        snapshot: [...new Set([...(prev.commits.find(commit => commit.hash === prev.headCommitHash)?.snapshot ?? []), ...source.files])],
      }],
      branches: { ...prev.branches, [prev.currentBranch]: newHash },
      headCommitHash: newHash,
    }))
    return [`[${repo.currentBranch} ${newHash}] ${source.message}`, 'Date: (cherry picked from commit ' + hash + ')']
  }

  return [`git: '${sub}' is not supported in this sandbox yet.`]
}

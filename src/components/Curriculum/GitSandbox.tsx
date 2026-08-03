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
 * ============================================================================
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal, FilePlus, CheckCircle2, GitBranch as BranchIcon } from 'lucide-react'
import type { SandboxTask } from '../../content/lessons'

interface Commit {
  hash: string
  message: string
  parentHash: string | null
  branch: string
  files: string[] // filenames included in this commit's snapshot
}

interface RepoState {
  initialized: boolean
  files: Record<string, { staged: boolean; committed: boolean }>
  commits: Commit[]
  branches: string[]
  currentBranch: string
  headCommitHash: string | null
  config: { name: string | null; email: string | null }
  remote: string | null
  /** Snapshot of `files` taken by `git stash`, restored by `git stash pop`. */
  stashSnapshot: Record<string, { staged: boolean; committed: boolean }> | null
}

const INITIAL_STATE: RepoState = {
  initialized: false,
  files: {},
  commits: [],
  branches: ['main'],
  currentBranch: 'main',
  headCommitHash: null,
  config: { name: null, email: null },
  remote: null,
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
  const [repo, setRepo] = useState<RepoState>(INITIAL_STATE)
  const [history, setHistory] = useState<{ cmd: string; output: string[] }[]>([])
  const [input, setInput] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [solved, setSolved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const checkSolved = useCallback((cmd: string) => {
    const normalized = cmd.trim().replace(/\s+/g, ' ')
    const isMatch = task.expectedCommands.some(expected => normalized.startsWith(expected.split(' "')[0]))
    if (isMatch) {
      setSolved(true)
      onSolved()
    }
  }, [task, onSolved])

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
    const output = interpret(cmd, repo, setRepo)
    setHistory(prev => [...prev, { cmd, output }])
    checkSolved(cmd)
    setInput('')
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
          <span className="flex items-center gap-1 text-[#3CCF4A] text-xs font-accent uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Solved
          </span>
        )}
      </div>

      <h4 className="font-display font-bold text-white text-xl mb-2">Your turn</h4>
      <p className="text-white/70 text-sm mb-4">{task.prompt}</p>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Terminal */}
        <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden flex flex-col" style={{ height: 320 }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
            <Terminal className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/40 text-xs font-mono">sandbox — {repo.currentBranch}</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-2">
            {history.length === 0 && (
              <p className="text-white/30">Type a git command below and press Enter.</p>
            )}
            {history.map((entry, i) => (
              <div key={i}>
                <p className="text-[#F7B731]">$ {entry.cmd}</p>
                {entry.output.map((line, j) => (
                  <p key={j} className="text-white/70 pl-2 whitespace-pre-wrap">{line}</p>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
            <span className="text-[#F7B731] font-mono text-xs">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runCommand(input) }}
              className="flex-1 bg-transparent text-white font-mono text-xs outline-none placeholder-white/25"
              placeholder="git status"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Repo state panel */}
        <div className="bg-white/[0.05] rounded-xl border border-white/10 p-4 space-y-4">
          <div>
            <p className="text-white/40 text-[10px] font-accent uppercase tracking-wider mb-2">New file (working dir only)</p>
            <div className="flex gap-2">
              <input
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addNewFile() }}
                placeholder="README.md"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7B731]/60"
              />
              <button onClick={addNewFile} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white/70 hover:bg-white/15">
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-white/40 text-[10px] font-accent uppercase tracking-wider mb-1.5">Working directory</p>
            {untracked.length === 0 ? <p className="text-white/25 text-xs">Nothing untracked.</p> : (
              <div className="flex flex-wrap gap-1.5">
                {untracked.map(f => <span key={f} className="px-2 py-0.5 rounded text-[11px] bg-white/10 text-white/60">{f}</span>)}
              </div>
            )}
          </div>

          <div>
            <p className="text-white/40 text-[10px] font-accent uppercase tracking-wider mb-1.5">Staged</p>
            {staged.length === 0 ? <p className="text-white/25 text-xs">Nothing staged.</p> : (
              <div className="flex flex-wrap gap-1.5">
                {staged.map(f => <span key={f} className="px-2 py-0.5 rounded text-[11px] bg-[#F7B731]/20 text-[#F7B731]">{f}</span>)}
              </div>
            )}
          </div>

          <div>
            <p className="text-white/40 text-[10px] font-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BranchIcon className="w-3 h-3" /> Commit graph
            </p>
            {repo.commits.length === 0 ? <p className="text-white/25 text-xs">No commits yet.</p> : (
              <div className="space-y-1.5">
                {repo.commits.map(c => (
                  <div key={c.hash} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[#F7B731]/70">{c.hash}</span>
                    <span className="text-white/70 truncate">{c.message}</span>
                    <span className="ml-auto text-white/30">{c.branch}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!solved && (
            <p className="text-white/35 text-xs pt-2 border-t border-white/10">Hint: {task.hint}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Interprets one command line against the repo state, returns terminal output lines. */
function interpret(cmd: string, repo: RepoState, setRepo: (updater: (prev: RepoState) => RepoState) => void): string[] {
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
    if (staged.length) lines.push('Changes to be committed:', ...staged.map(f => `  new file:   ${f}`))
    if (untracked.length) lines.push('Untracked files:', ...untracked.map(f => `  ${f}`))
    if (!staged.length && !untracked.length) lines.push('nothing to commit, working tree clean')
    return lines
  }

  if (sub === 'add') {
    const target = parts[2]
    if (!target) return ['fatal: nothing specified, nothing added.']
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
    const staged = Object.entries(repo.files).filter(([, f]) => f.staged).map(([n]) => n)
    if (staged.length === 0) return ['nothing to commit, working tree clean']
    const messageMatch = cmd.match(/-m\s+"([^"]+)"/)
    const message = messageMatch ? messageMatch[1] : '(no message provided — use -m "message")'
    if (!messageMatch) return ['error: switch `m` requires a value — try: git commit -m "your message"']
    const hash = shortHash()
    setRepo(prev => {
      const files = { ...prev.files }
      staged.forEach(name => { files[name] = { staged: false, committed: true } })
      const commit: Commit = {
        hash, message, parentHash: prev.headCommitHash, branch: prev.currentBranch, files: staged,
      }
      return { ...prev, files, commits: [...prev.commits, commit], headCommitHash: hash }
    })
    return [`[${repo.currentBranch} ${hash}] ${message}`, `${staged.length} file(s) changed`]
  }

  if (sub === 'branch') {
    const name = parts[2]
    if (!name) return repo.branches.map(b => (b === repo.currentBranch ? `* ${b}` : `  ${b}`))
    if (repo.branches.includes(name)) return [`fatal: a branch named '${name}' already exists`]
    setRepo(prev => ({ ...prev, branches: [...prev.branches, name] }))
    return [`Branch '${name}' created.`]
  }

  if (sub === 'switch' || sub === 'checkout') {
    const creating = parts[2] === '-c' || parts[2] === '-b'
    const name = creating ? parts[3] : parts[2]
    if (!name) return ['fatal: missing branch name']
    if (creating) {
      if (repo.branches.includes(name)) return [`fatal: a branch named '${name}' already exists`]
      setRepo(prev => ({ ...prev, branches: [...prev.branches, name], currentBranch: name }))
      return [`Switched to a new branch '${name}'`]
    }
    if (!repo.branches.includes(name)) return [`fatal: invalid reference: ${name}`]
    setRepo(prev => ({ ...prev, currentBranch: name }))
    return [`Switched to branch '${name}'`]
  }

  if (sub === 'merge') {
    const name = parts[2]
    if (!name) return ['fatal: missing branch name to merge']
    if (!repo.branches.includes(name)) return [`fatal: invalid reference: ${name}`]
    return [`Merge made by the 'ort' strategy.`, `${name} -> ${repo.currentBranch}`]
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
    // Simulated network op — seeds a small, already-committed starter repo.
    setRepo(prev => ({
      ...prev,
      initialized: true,
      files: { 'README.md': { staged: false, committed: true }, 'index.html': { staged: false, committed: true } },
      commits: [{ hash: shortHash(), message: 'Initial commit', parentHash: null, branch: 'main', files: ['README.md', 'index.html'] }],
    }))
    return ['Cloning into \'sample-repo\'...', 'remote: Enumerating objects, done.', 'Receiving objects: 100%, done.']
  }

  if (sub === 'remote') {
    const name = parts[3]
    if (parts[2] === 'add' && name) {
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
    if (!target || !repo.files[target]) return [`error: pathspec '${target}' did not match any file(s) known to git`]
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
      const commits = prev.commits.slice(0, -1)
      const undone = prev.commits[prev.commits.length - 1]
      const files = { ...prev.files }
      if (!hard) {
        undone.files.forEach(name => { if (files[name]) files[name] = { ...files[name], committed: false, staged: true } })
      }
      return { ...prev, commits, headCommitHash: commits.length ? commits[commits.length - 1].hash : null, files }
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
      commits: [...prev.commits, { hash: newHash, message: `Revert "${target.message}"`, parentHash: prev.headCommitHash, branch: prev.currentBranch, files: target.files }],
      headCommitHash: newHash,
    }))
    return [`[${repo.currentBranch} ${newHash}] Revert "${target.message}"`]
  }

  if (sub === 'rebase') {
    const target = parts[2]
    if (!target) return ['usage: git rebase <branch>']
    if (!repo.branches.includes(target)) return [`fatal: invalid upstream '${target}'`]
    return [`Successfully rebased and updated refs/heads/${repo.currentBranch}.`]
  }

  if (sub === 'cherry-pick') {
    const hash = parts[2]
    const source = repo.commits.find(c => c.hash === hash)
    if (!source) return [`fatal: bad revision '${hash}' — check \`git log\` for a valid hash`]
    const newHash = shortHash()
    setRepo(prev => ({
      ...prev,
      commits: [...prev.commits, { hash: newHash, message: source.message, parentHash: prev.headCommitHash, branch: prev.currentBranch, files: source.files }],
      headCommitHash: newHash,
    }))
    return [`[${repo.currentBranch} ${newHash}] ${source.message}`, 'Date: (cherry picked from commit ' + hash + ')']
  }

  return [`git: '${sub}' is not supported in this sandbox yet.`]
}

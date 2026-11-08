export interface GitCommit {
  hash: string
  message: string
  parentHash: string | null
  secondParentHash?: string | null
  branch: string
  files: string[]
  snapshot?: string[]
}

export type BranchRefs = Record<string, string | null>

export type MergeDisposition = 'already-up-to-date' | 'fast-forward' | 'merge-commit'

export function isCommitAncestor(
  ancestorHash: string | null,
  descendantHash: string | null,
  commits: GitCommit[],
): boolean {
  if (!ancestorHash || !descendantHash) return false
  const byHash = new Map(commits.map(commit => [commit.hash, commit]))
  const pending = [descendantHash]
  const visited = new Set<string>()

  while (pending.length > 0) {
    const hash = pending.pop()!
    if (hash === ancestorHash) return true
    if (visited.has(hash)) continue
    visited.add(hash)
    const commit = byHash.get(hash)
    if (commit?.parentHash) pending.push(commit.parentHash)
    if (commit?.secondParentHash) pending.push(commit.secondParentHash)
  }
  return false
}

export function getMergeDisposition(
  currentHash: string | null,
  sourceHash: string | null,
  commits: GitCommit[],
): MergeDisposition {
  if (!sourceHash || isCommitAncestor(sourceHash, currentHash, commits)) return 'already-up-to-date'
  if (!currentHash || isCommitAncestor(currentHash, sourceHash, commits)) return 'fast-forward'
  return 'merge-commit'
}

export function createMergeCommit(
  currentBranch: string,
  currentHash: string,
  sourceHash: string,
  hash: string,
  files: string[],
): GitCommit {
  return {
    hash,
    message: `Merge commit '${sourceHash}' into ${currentBranch}`,
    parentHash: currentHash,
    secondParentHash: sourceHash,
    branch: currentBranch,
    files,
    snapshot: [...new Set(files)],
  }
}

export function getCommitHistory(headHash: string | null, commits: GitCommit[]): GitCommit[] {
  const byHash = new Map(commits.map(commit => [commit.hash, commit]))
  const history: GitCommit[] = []
  const visited = new Set<string>()
  const pending = headHash ? [headHash] : []

  while (pending.length > 0) {
    const hash = pending.pop()!
    if (visited.has(hash)) continue
    visited.add(hash)
    const commit = byHash.get(hash)
    if (!commit) continue
    history.push(commit)
    if (commit.secondParentHash) pending.push(commit.secondParentHash)
    if (commit.parentHash) pending.push(commit.parentHash)
  }
  return history
}

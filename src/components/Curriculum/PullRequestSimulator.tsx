import { useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  Circle,
  GitBranch,
  GitMerge,
  GitPullRequest,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react'

interface Props {
  prompt: string
  onSolved: () => void
}

interface Commit {
  id: number
  message: string
  summary: string
}

type ReviewStatus = 'changes-requested' | 'approved'
type CheckStatus = 'pending' | 'passed'

const reviewComment = 'Please add a test for an empty project name so this edge case is covered.'

export default function PullRequestSimulator({ prompt, onSolved }: Props) {
  const [branchCreated, setBranchCreated] = useState(false)
  const [commits, setCommits] = useState<Commit[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [commitSummary, setCommitSummary] = useState('')
  const [prTitle, setPrTitle] = useState('')
  const [prDescription, setPrDescription] = useState('')
  const [prOpen, setPrOpen] = useState(false)
  const [reviewReply, setReviewReply] = useState('')
  const [fixMessage, setFixMessage] = useState('')
  const [fixSummary, setFixSummary] = useState('')
  const [fixCommitted, setFixCommitted] = useState(false)
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('changes-requested')
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('pending')
  const [merged, setMerged] = useState(false)

  const addCommit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCommits(previous => [
      ...previous,
      { id: previous.length + 1, message: commitMessage.trim(), summary: commitSummary.trim() },
    ])
    setCommitMessage('')
    setCommitSummary('')
  }

  const openPullRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPrOpen(true)
  }

  const submitReviewChanges = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFixCommitted(true)
    setCheckStatus('pending')
  }

  const mergePullRequest = () => {
    if (reviewStatus !== 'approved' || checkStatus !== 'passed') return
    setMerged(true)
    onSolved()
  }

  const stepClass = (complete: boolean) => complete ? 'cur-success-text' : 'cur-text-faint'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <GitPullRequest className="h-4 w-4 cur-link" />
        <span className="px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider cur-pill">
          Pull request lab
        </span>
        {merged && (
          <span className="flex items-center gap-1 text-xs font-accent uppercase tracking-wider cur-success-text">
            <CheckCircle2 className="h-3.5 w-3.5" /> Merged
          </span>
        )}
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-400/10 px-4 py-3 text-xs cur-text-soft">
        Training simulation only. It does not connect to GitHub or publish code.
      </div>

      <h2 className="font-display text-xl font-bold cur-text">Pull request simulator</h2>
      <p className="text-sm cur-text-soft">{prompt}</p>

      <ol aria-label="Pull request workflow" className="grid gap-2 sm:grid-cols-3">
        {[
          ['1. Branch and commits', branchCreated && commits.length >= 2],
          ['2. Open and update PR', prOpen && fixCommitted],
          ['3. Review, checks, merge', merged],
        ].map(([label, complete]) => (
          <li key={label as string} className={`flex items-center gap-2 text-xs ${stepClass(Boolean(complete))}`}>
            {complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {label}
          </li>
        ))}
      </ol>

      {!branchCreated && (
        <section className="cur-card rounded-xl p-4">
          <h3 className="font-display font-bold cur-text">Start from the default branch</h3>
          <p className="mt-1 text-sm cur-text-soft">
            Create <code className="font-mono">feature/project-setup</code> from <code className="font-mono">main</code>.
            Your work stays isolated until the pull request is merged.
          </p>
          <button onClick={() => setBranchCreated(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-punch px-4 py-2 text-sm font-semibold text-[#1F1F1F]">
            <GitBranch className="h-4 w-4" /> Create feature branch
          </button>
        </section>
      )}

      {branchCreated && !prOpen && (
        <section className="cur-card rounded-xl p-4">
          <h3 className="font-display font-bold cur-text">Build your change</h3>
          <p className="mt-1 text-sm cur-text-soft">
            Add at least two small commits. Each commit should describe a focused piece of work.
          </p>
          <form onSubmit={addCommit} className="mt-4 space-y-3">
            <label className="block text-xs font-semibold cur-text">
              Commit message
              <input required value={commitMessage} onChange={event => setCommitMessage(event.target.value)}
                placeholder="Add project name validation"
                className="cur-card cur-text mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F7B731]" />
            </label>
            <label className="block text-xs font-semibold cur-text">
              What changed?
              <textarea required value={commitSummary} onChange={event => setCommitSummary(event.target.value)}
                placeholder="Describe the change in this commit"
                className="cur-card cur-text mt-1 block min-h-20 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F7B731]" />
            </label>
            <button type="submit"
              className="rounded-lg bg-rose-punch px-4 py-2 text-sm font-semibold text-[#1F1F1F]">
              Add commit
            </button>
          </form>

          {commits.length > 0 && (
            <ol aria-label="Feature branch commits" className="mt-4 space-y-2">
              {commits.map(commit => (
                <li key={commit.id} className="flex gap-2 rounded-lg bg-black/5 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 cur-success-text" />
                  <div>
                    <p className="font-semibold cur-text">{commit.message}</p>
                    <p className="text-xs cur-text-soft">{commit.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {commits.length >= 2 && (
            <form onSubmit={openPullRequest} className="mt-5 space-y-3 border-t border-black/10 pt-4">
              <h4 className="font-display font-bold cur-text">Open a pull request</h4>
              <p className="text-xs cur-text-soft">
                A PR proposes merging <code className="font-mono">feature/project-setup</code> into <code className="font-mono">main</code>.
                The commits are still on your feature branch until merge.
              </p>
              <label className="block text-xs font-semibold cur-text">
                Pull request title
                <input required value={prTitle} onChange={event => setPrTitle(event.target.value)}
                  placeholder="Validate project setup input"
                  className="cur-card cur-text mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F7B731]" />
              </label>
              <label className="block text-xs font-semibold cur-text">
                Description: what changed and why?
                <textarea required value={prDescription} onChange={event => setPrDescription(event.target.value)}
                  placeholder="Summarize the change and how you checked it"
                  className="cur-card cur-text mt-1 block min-h-20 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F7B731]" />
              </label>
              <button type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-rose-punch px-4 py-2 text-sm font-semibold text-[#1F1F1F]">
                <GitPullRequest className="h-4 w-4" /> Open pull request
              </button>
            </form>
          )}
        </section>
      )}

      {prOpen && (
        <>
          <section className="cur-card rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider cur-text-faint">Open pull request</p>
                <h3 className="mt-1 font-display text-lg font-bold cur-text">{prTitle}</h3>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold cur-success-text">
                Open · feature/project-setup → main
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm cur-text-soft">{prDescription}</p>
            <p className="mt-4 text-xs cur-text-faint">{commits.length + (fixCommitted ? 1 : 0)} commits on the feature branch</p>
          </section>

          <section className="cur-card rounded-xl p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 cur-link" />
              <h3 className="font-display font-bold cur-text">Reviewer feedback</h3>
              <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
                reviewStatus === 'approved' ? 'bg-emerald-500/15 cur-success-text' : 'bg-amber-500/15 cur-text'
              }`}>
                {reviewStatus === 'approved' ? 'Approved' : 'Changes requested'}
              </span>
            </div>

            {!fixCommitted ? (
              <>
                <blockquote className="mt-3 border-l-2 border-amber-500 pl-3 text-sm cur-text-soft">
                  {reviewComment}
                </blockquote>
                <form onSubmit={submitReviewChanges} className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold cur-text">
                    Reply to reviewer
                    <textarea required value={reviewReply} onChange={event => setReviewReply(event.target.value)}
                      placeholder="Acknowledge the feedback and explain your plan"
                      className="cur-card cur-text mt-1 block min-h-20 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F7B731]" />
                  </label>
                  <label className="block text-xs font-semibold cur-text">
                    Follow-up commit message
                    <input required value={fixMessage} onChange={event => setFixMessage(event.target.value)}
                      placeholder="Test empty project name"
                      className="cur-card cur-text mt-1 block w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F7B731]" />
                  </label>
                  <label className="block text-xs font-semibold cur-text">
                    How does the commit address the comment?
                    <textarea required value={fixSummary} onChange={event => setFixSummary(event.target.value)}
                      placeholder="Describe the test or fix you added"
                      className="cur-card cur-text mt-1 block min-h-20 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F7B731]" />
                  </label>
                  <button type="submit"
                    className="rounded-lg bg-rose-punch px-4 py-2 text-sm font-semibold text-[#1F1F1F]">
                    Reply and push follow-up commit
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-3 space-y-3">
                <blockquote className="border-l-2 border-amber-500 pl-3 text-sm cur-text-soft">
                  {reviewComment}
                </blockquote>
                <p className="text-sm cur-text"><span className="font-semibold">Your reply:</span> {reviewReply}</p>
                <p className="text-sm cur-text"><span className="font-semibold">New commit:</span> {fixMessage}</p>
                <p className="text-xs cur-text-soft">{fixSummary}</p>
                {reviewStatus === 'changes-requested' && (
                  <button onClick={() => setReviewStatus('approved')}
                    className="rounded-lg border border-current px-4 py-2 text-sm font-semibold cur-link">
                    Send update for re-review
                  </button>
                )}
              </div>
            )}
          </section>

          {fixCommitted && (
            <section className="cur-card rounded-xl p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 cur-link" />
                <h3 className="font-display font-bold cur-text">Required checks</h3>
                <span className={`ml-auto text-xs font-semibold ${checkStatus === 'passed' ? 'cur-success-text' : 'cur-text-faint'}`}>
                  {checkStatus === 'passed' ? 'All checks passed' : 'Waiting to run'}
                </span>
              </div>
              <p className="mt-2 text-xs cur-text-soft">
                Pushing a new commit updates the PR and triggers its checks again. A review approval alone cannot bypass failing checks.
              </p>
              {checkStatus === 'pending' && (
                <button onClick={() => setCheckStatus('passed')}
                  className="mt-3 rounded-lg border border-current px-4 py-2 text-sm font-semibold cur-link">
                  Run required checks
                </button>
              )}
              {checkStatus === 'passed' && (
                <p role="status" className="mt-3 flex items-center gap-2 text-sm cur-success-text">
                  <CheckCircle2 className="h-4 w-4" /> Tests and review requirements passed.
                </p>
              )}
            </section>
          )}

          <section className="cur-card rounded-xl p-4">
            <h3 className="font-display font-bold cur-text">Merge gate</h3>
            <p className="mt-1 text-sm cur-text-soft">
              GitHub can merge only when the required review is approved and required checks pass.
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p className={stepClass(reviewStatus === 'approved')}>
                {reviewStatus === 'approved' ? '✓' : '○'} Reviewer approval
              </p>
              <p className={stepClass(checkStatus === 'passed')}>
                {checkStatus === 'passed' ? '✓' : '○'} Required checks pass
              </p>
            </div>
            <button onClick={mergePullRequest} disabled={reviewStatus !== 'approved' || checkStatus !== 'passed' || merged}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-punch px-4 py-2 text-sm font-semibold text-[#1F1F1F] disabled:cursor-not-allowed disabled:opacity-50">
              <GitMerge className="h-4 w-4" /> Merge pull request
            </button>
            {merged && (
              <p role="status" className="mt-3 flex items-center gap-2 text-sm cur-success-text">
                <CheckCircle2 className="h-4 w-4" /> Merged into main. The feature branch can now be deleted.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

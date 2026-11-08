import { useState } from 'react'
import { CheckCircle2, FileCode2, MessageCircle } from 'lucide-react'
import type { SandboxTask } from '../../content/lessons'
import { validateWorkflow } from '../../lib/workflowValidation'
import { requestGitterHelp } from '../../lib/gitterSupport'

interface Props {
  task: SandboxTask
  onSolved: () => void
}

const STARTER_WORKFLOW = `name: CI
on:
  # Add the required trigger here.
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # Add checkout and run steps here.
`

export default function WorkflowSandbox({ task, onSolved }: Props) {
  const [workflow, setWorkflow] = useState(STARTER_WORKFLOW)
  const [workflowPath, setWorkflowPath] = useState(task.workflowRequirements?.path ? '' : '.github/workflows/ci.yml')
  const [feedback, setFeedback] = useState('')
  const [validationFailed, setValidationFailed] = useState(false)
  const [solved, setSolved] = useState(false)

  const handleValidateWorkflow = () => {
    const requirements = task.workflowRequirements
    if (!requirements) {
      setFeedback('This workflow exercise is missing its validation requirements.')
      return
    }

    const validationError = validateWorkflow(workflowPath, workflow, requirements)
    if (validationError) {
      setFeedback(validationError)
      setValidationFailed(true)
      return
    }

    setFeedback('Workflow checks passed: the trigger and CI steps are in place.')
    setValidationFailed(false)
    setSolved(true)
    onSolved()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-[#3CCF4A] text-[#173A1B]">
          Workflow lab
        </span>
        {solved && (
          <span className="flex items-center gap-1 text-xs font-accent uppercase tracking-wider cur-success-text">
            <CheckCircle2 className="w-3.5 h-3.5" /> Checks passed
          </span>
        )}
      </div>

      <h4 className="font-display font-bold text-xl mb-2 cur-text">Your turn</h4>
      <p className="text-sm mb-4 cur-text-soft">{task.prompt}</p>

      {task.workflowRequirements?.path && (
        <label className="block text-xs font-accent uppercase tracking-wider mb-3 cur-text-faint">
          Workflow file path
          <span className="flex items-center gap-2 mt-1.5">
            <FileCode2 className="w-4 h-4 flex-shrink-0" />
            <input
              value={workflowPath}
              onChange={event => setWorkflowPath(event.target.value)}
              className="cur-card cur-text min-w-0 flex-1 rounded-lg px-2.5 py-2 font-mono text-xs normal-case tracking-normal outline-none"
              spellCheck={false}
            />
          </span>
        </label>
      )}

      <label className="block text-xs font-accent uppercase tracking-wider mb-2 cur-text-faint">
        Workflow YAML
        <textarea
          value={workflow}
          onChange={event => {
            setWorkflow(event.target.value)
            setFeedback('')
            setValidationFailed(false)
          }}
          className="cur-terminal term-input mt-1.5 block min-h-56 w-full rounded-xl p-4 font-mono text-xs leading-6 outline-none focus:ring-2 focus:ring-[#F7B731]"
          spellCheck={false}
          aria-label="GitHub Actions workflow YAML"
        />
      </label>

      <p className="text-xs mb-3 cur-text-faint">
        This lab checks the required workflow structure and steps; GitHub performs full YAML validation when you push it.
      </p>
      {feedback && (
        <div role="status" className={`text-sm mb-3 ${solved ? 'cur-success-text' : 'cur-text-soft'}`}>
          <p>{feedback}</p>
          {validationFailed && (
            <>
              <p className="mt-1 text-xs">Why it matters: GitHub Actions needs the expected file location and workflow steps before it can run this CI check.</p>
              <p className="mt-1 text-xs">Try next: {task.hint}</p>
              <button
                onClick={() => requestGitterHelp(
                  `I'm working on a GitHub Actions workflow exercise. Task: ${task.prompt}. My workflow path is "${workflowPath}". The validator says: "${feedback}". Here is my YAML:\n${workflow}\nExplain the issue and suggest a focused fix.`
                )}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold cur-link hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Ask Gitter for help (Lite is free)
              </button>
            </>
          )}
        </div>
      )}
      {!solved && (
        <button
          onClick={handleValidateWorkflow}
          className="bg-rose-punch text-[#ffffff] font-display font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Validate workflow
        </button>
      )}
      {!solved && <p className="text-xs mt-3 cur-text-faint">Hint: {task.hint}</p>}
    </div>
  )
}

import type { WorkflowRequirements } from '../content/lessons'

export function validateWorkflow(
  workflowPath: string,
  workflow: string,
  requirements: WorkflowRequirements,
): string | null {
  if (requirements.path && workflowPath.trim() !== requirements.path) {
    return `Save the workflow at ${requirements.path}.`
  }

  const lines = workflow.replace(/\r\n/g, '\n').split('\n')
  const onIndex = lines.findIndex(line => /^on:\s*(?:#.*)?$/.test(line))
  const jobsIndex = lines.findIndex(line => /^jobs:\s*(?:#.*)?$/.test(line))
  const stepsIndex = lines.findIndex((line, index) =>
    index > jobsIndex && /^\s{4}steps:\s*$/.test(line)
  )
  const eventIndex = lines.findIndex((line, index) =>
    index > onIndex && (jobsIndex === -1 || index < jobsIndex)
    && line.trim() === `${requirements.event}:`
  )
  if (onIndex === -1 || eventIndex === -1 || (jobsIndex !== -1 && eventIndex > jobsIndex)) {
    return `Add ${requirements.event}: under the on: trigger section.`
  }

  if (jobsIndex === -1 || stepsIndex === -1) {
    return 'Add a jobs: section with a job and a steps: list.'
  }

  for (const action of requirements.actions ?? []) {
    const actionIndex = lines.findIndex((line, index) => index > stepsIndex && line.includes(action))
    if (actionIndex === -1) return `Add the ${action} action to the workflow steps.`
  }

  const runSteps = lines.flatMap((line, index) => {
    const match = /^\s*-\s*run:\s*(.*?)\s*$/.exec(line)
    return match && index > stepsIndex ? [{ command: match[1], index }] : []
  })
  let afterIndex = -1
  for (const command of requirements.commands) {
    const next = runSteps.find(step => step.index > afterIndex && step.command === command)
    if (!next) {
      return `Add a run step for ${command}${afterIndex >= 0 ? ' after the previous command' : ''}.`
    }
    afterIndex = next.index
  }

  return null
}

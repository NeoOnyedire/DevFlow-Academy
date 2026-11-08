import { describe, expect, it } from 'vitest'
import { validateWorkflow } from '../src/lib/workflowValidation'

const requirements = {
  event: 'pull_request',
  commands: ['npm ci', 'npm test'],
  actions: ['actions/checkout@v4'],
  path: '.github/workflows/ci.yml',
}

const validWorkflow = `name: CI
on:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
`

describe('validateWorkflow', () => {
  it('accepts a workflow with the required path, trigger, checkout, and ordered test steps', () => {
    expect(validateWorkflow('.github/workflows/ci.yml', validWorkflow, requirements)).toBeNull()
  })

  it('rejects a workflow saved outside the Actions folder', () => {
    expect(validateWorkflow('workflow.yml', validWorkflow, requirements)).toBe(
      'Save the workflow at .github/workflows/ci.yml.',
    )
  })

  it('rejects required commands that are missing or out of order', () => {
    const invalidWorkflow = validWorkflow.replace('      - run: npm ci\n', '')
    expect(validateWorkflow('.github/workflows/ci.yml', invalidWorkflow, requirements)).toBe(
      'Add a run step for npm ci.',
    )

    const reversedWorkflow = validWorkflow.replace(
      '      - run: npm ci\n      - run: npm test',
      '      - run: npm test\n      - run: npm ci',
    )
    expect(validateWorkflow('.github/workflows/ci.yml', reversedWorkflow, requirements)).toBe(
      'Add a run step for npm test after the previous command.',
    )
  })

  it('requires the workflow event to be declared in the on section', () => {
    expect(validateWorkflow('.github/workflows/ci.yml', validWorkflow.replace('  pull_request:', '  push:'), requirements)).toBe(
      'Add pull_request: under the on: trigger section.',
    )
  })

  it('requires a jobs section with a steps list', () => {
    expect(validateWorkflow('.github/workflows/ci.yml', validWorkflow.replace('jobs:\n', ''), requirements)).toBe(
      'Add a jobs: section with a job and a steps: list.',
    )
  })
})

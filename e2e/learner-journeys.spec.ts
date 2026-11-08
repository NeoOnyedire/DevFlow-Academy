import { expect, test, type Page } from '@playwright/test'

const testUser = {
  id: 'e2e-learner',
  name: 'E2E Learner',
  email: 'learner@example.test',
  provider: 'password',
  hasReviewedCourse: false,
  emailVerified: true,
}

async function mockAppApi(page: Page, signedIn = false, completedLessonIds: string[] = []) {
  await page.route('**/api/**', async route => {
    const { pathname } = new URL(route.request().url())
    let data: Record<string, unknown> = {}

    if (pathname === '/api/auth/me') {
      data = { user: signedIn ? testUser : null }
    } else if (pathname === '/api/progress') {
      data = { completedModules: [] }
    } else if (pathname === '/api/lesson-progress') {
      data = route.request().method() === 'GET'
        ? { completedLessonIds }
        : { ok: true, moduleCompleted: false }
    } else if (pathname === '/api/reviews') {
      data = { reviews: [] }
    } else if (pathname === '/api/leaderboard') {
      data = { entries: [], challengeIds: [] }
    } else if (pathname === '/api/gitter') {
      data = { text: 'Here is a helpful Git explanation.' }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  })

  await page.route('https://www.youtube.com/embed/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Video placeholder</title>',
    }),
  )
}

test.describe('guest learning journey', () => {
  test('completes the account setup preview and keeps it completed after reload', async ({ page }) => {
    await mockAppApi(page)
    await page.goto('/learn', { waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: /GitHub Account Setup A quick, free preview/ }).click()
    await expect(page).toHaveURL(/\/learn\/mod-00\/lesson-00-account$/)
    await expect(page.getByRole('heading', { name: 'Create your GitHub account' })).toBeVisible()

    await page.getByRole('button', { name: 'Mark as done (this browser only)' }).click()
    await expect(page).toHaveURL('/learn')
    const setupModule = page.getByRole('button', { name: /GitHub Account Setup A quick, free preview/ })
    await expect(setupModule.getByText('Done', { exact: true })).toBeVisible()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /GitHub Account Setup A quick, free preview/ }).getByText('Done', { exact: true })).toBeVisible()
  })

  test('keeps full modules locked until the learner signs in', async ({ page }) => {
    await mockAppApi(page)
    await page.goto('/learn/mod-01', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'This module is locked' })).toBeVisible()
    await page.getByRole('button', { name: /Join Free/ }).click()
    await expect(page.getByRole('heading', { name: /Join DevFlow Academy|Welcome Back/ })).toBeVisible()
  })
})

test.describe('signed-in learning journey', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppApi(page, true)
  })

  test('offers quiz feedback and lets a learner retry before completing the Git sandbox', async ({ page }) => {
    await page.goto('/learn/mod-01/mod-01-lesson-01', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /Continue to quiz/ })).toBeEnabled()
    await page.getByRole('button', { name: /Continue to quiz/ }).click()

    await page.getByRole('button', { name: 'A website for hosting code' }).click()
    await expect(page.getByText('Not quite.', { exact: false })).toBeVisible()
    await expect(page.getByText(/Retry hint:/)).toBeVisible()
    await page.getByRole('button', { name: 'Try again' }).click()

    await page.getByRole('button', { name: 'A version control system that tracks changes to files over time' }).click()
    await page.getByRole('button', { name: 'Next question' }).click()
    await page.getByRole('button', { name: 'A cloud-hosting service for repositories that use Git underneath' }).click()
    await page.getByRole('button', { name: /Continue to sandbox/ }).click()

    const commandInput = page.getByPlaceholder('git status')
    await commandInput.fill('git status')
    await commandInput.press('Enter')
    await expect(page.getByText('Why it didn’t work')).toBeVisible()
    await expect(page.getByText(/Run `git init` first/)).toBeVisible()

    await page.getByRole('button', { name: /Ask Gitter for help/ }).click()
    await expect(page.getByText(/I'm using the Git sandbox/)).toBeVisible()
    await expect(page.getByText(/Git couldn't find a repository in the current folder/)).toBeVisible()

    await commandInput.fill('git init')
    await commandInput.press('Enter')
    await commandInput.fill('git status')
    await commandInput.press('Enter')
    await expect(page.getByText('Solved', { exact: true })).toBeVisible()
  })

  test('completes Module 1 without connecting an AI key or paying for AI', async ({ page }) => {
    await mockAppApi(page, true, [
      'mod-01-lesson-01',
      'mod-01-lesson-02',
      'mod-01-lesson-03',
      'mod-01-lesson-04',
      'mod-01-lesson-05',
      'mod-01-lesson-06',
    ])
    await page.goto('/learn/mod-01/mod-01-lesson-07', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /Continue to quiz/ }).click()
    await page.getByRole('button', { name: 'main' }).click()
    await page.getByRole('button', { name: /Continue to sandbox/ }).click()

    await page.getByRole('textbox', { name: 'README.md' }).fill('README.md')
    await page.getByRole('button', { name: 'Create file' }).click()
    const commandInput = page.getByPlaceholder('git status')
    for (const command of [
      'git init',
      'git switch -c feature/readme',
      'git add README.md',
      'git commit -m "Add README"',
      'git switch main',
      'git merge feature/readme',
    ]) {
      await commandInput.fill(command)
      await commandInput.press('Enter')
    }

    await expect(page).toHaveURL(/\/learn\/mod-02\//)
  })

  test('explains workflow validation failures and accepts a corrected CI workflow', async ({ page }) => {
    await page.goto('/learn/mod-08/mod-08-lesson-02', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /Continue to quiz/ }).click()
    await page.getByRole('button', { name: '.github/workflows/' }).click()
    await page.getByRole('button', { name: /Continue to sandbox/ }).click()

    await page.getByRole('button', { name: 'Validate workflow' }).click()
    await expect(page.getByText(/Save the workflow at \.github\/workflows\/ci\.yml/)).toBeVisible()
    await expect(page.getByText(/Why it matters:/)).toBeVisible()

    await page.getByLabel('Workflow file path').fill('.github/workflows/ci.yml')
    await page.getByLabel('GitHub Actions workflow YAML').fill(`name: CI
on:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
`)
    await page.getByRole('button', { name: 'Validate workflow' }).click()
    await expect(page).toHaveURL(/\/learn\/mod-08\/mod-08-lesson-03$/)
    await expect(page.getByRole('heading', { name: 'Reading a failed build' })).toBeVisible()
  })
})

import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function expectAccessible(page: Page) {
  await expect(page.locator('main')).toBeVisible()
  const results = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  const violations = results.violations.map(({ id, impact, help, nodes }) => ({
    id,
    impact,
    help,
    elements: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }))

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
}

async function gotoLearnerPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main')).toBeVisible()
}

async function tabTo(page: Page, target: ReturnType<Page['getByRole']>, maxTabs = 40) {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab')
    if (await target.evaluate(element => element === element.ownerDocument.activeElement)) return
  }
  throw new Error(`Could not reach ${await target.getAttribute('aria-label') ?? 'the requested control'} with Tab`)
}

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
  test('supports keyboard navigation and Escape in the mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLearnerPage(page, '/learn')

    const menuToggle = page.locator('button[aria-controls="mobile-navigation"]')
    await tabTo(page, menuToggle)
    await page.keyboard.press('Enter')
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
    await expect(menuToggle).toBeFocused()

    await page.keyboard.press('Enter')
    const practiceLink = page.getByRole('link', { name: /Practice/ })
    await tabTo(page, practiceLink)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/practice$/)
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('keeps keyboard focus inside the auth dialog and restores it on close', async ({ page }) => {
    await mockAppApi(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await gotoLearnerPage(page, '/learn')
    const loginButton = page.locator('button[title="Login"]')
    await loginButton.click()

    const dialog = page.getByRole('dialog', { name: 'Welcome Back' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator(':focus')).toHaveCount(1)

    await page.keyboard.press('Shift+Tab')
    await expect(dialog.locator(':focus')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(loginButton).toBeFocused()
  })

  test('completes the account setup preview and keeps it completed after reload', async ({ page }) => {
    await mockAppApi(page)
    await gotoLearnerPage(page, '/learn')
    await expectAccessible(page)

    await page.getByRole('button', { name: /GitHub Account Setup A quick, free preview/ }).click()
    await expect(page).toHaveURL(/\/learn\/mod-00\/lesson-00-account$/)
    await expect(page.getByRole('heading', { name: 'Create your GitHub account' })).toBeVisible()
    await expectAccessible(page)

    await page.getByRole('button', { name: 'Mark as done (this browser only)' }).click()
    await expect(page).toHaveURL('/learn')
    const setupModule = page.getByRole('button', { name: /GitHub Account Setup A quick, free preview/ })
    await expect(setupModule.getByText('Done', { exact: true })).toBeVisible()

    await page.reload({ waitUntil: 'commit' })
    await expect(page.getByRole('button', { name: /GitHub Account Setup A quick, free preview/ }).getByText('Done', { exact: true })).toBeVisible()
  })

  test('keeps full modules locked until the learner signs in', async ({ page }) => {
    await mockAppApi(page)
    await gotoLearnerPage(page, '/learn/mod-01')

    await expect(page.getByRole('heading', { name: 'This module is locked' })).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: /Join Free/ }).click()
    await expect(page.getByRole('heading', { name: /Join DevFlow Academy|Welcome Back/ })).toBeVisible()
    await expectAccessible(page)
  })
})

test.describe('signed-in learning journey', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppApi(page, true)
  })

  test('supports keyboard-only navigation through a quiz retry', async ({ page }) => {
    await gotoLearnerPage(page, '/learn/mod-01/mod-01-lesson-01')
    const continueButton = page.getByRole('button', { name: /Continue to quiz/ })
    await expect(continueButton).toBeEnabled()
    await tabTo(page, continueButton)
    await page.keyboard.press('Enter')

    const incorrectAnswer = page.getByRole('button', { name: 'A website for hosting code' })
    await tabTo(page, incorrectAnswer)
    await page.keyboard.press('Enter')
    await expect(page.getByText('Not quite.', { exact: false })).toBeVisible()

    const retryButton = page.getByRole('button', { name: 'Try again' })
    await tabTo(page, retryButton)
    await page.keyboard.press('Enter')

    const correctAnswer = page.getByRole('button', { name: 'A version control system that tracks changes to files over time' })
    await tabTo(page, correctAnswer)
    await page.keyboard.press('Enter')
    await expect(correctAnswer).toBeDisabled()
  })

  test('shows a retryable error instead of completing a lesson when progress save fails', async ({ page }) => {
    let saveAttempts = 0
    await page.route('**/api/lesson-progress', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ completedLessonIds: [] }),
        })
        return
      }

      saveAttempts += 1
      await route.fulfill({
        status: saveAttempts === 1 ? 502 : 200,
        contentType: 'application/json',
        body: JSON.stringify(saveAttempts === 1
          ? { error: 'Could not save your lesson progress right now.' }
          : { ok: true, moduleCompleted: false }),
      })
    })

    await gotoLearnerPage(page, '/learn/mod-00/lesson-00-account')
    await page.getByRole('button', { name: 'Mark lesson complete' }).click()
    await expect(page.getByRole('alert')).toHaveText('Could not save your lesson progress right now.')
    await expect(page).toHaveURL('/learn/mod-00/lesson-00-account')

    await page.getByRole('button', { name: 'Retry saving lesson' }).click()
    await expect(page).toHaveURL(/\/learn\/mod-01\//)
    expect(saveAttempts).toBe(2)
  })

  test('shows a retryable error instead of assuming no lessons are complete when progress load fails', async ({ page }) => {
    await page.route('**/api/lesson-progress**', async route => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Could not load your lesson progress right now.' }),
      })
    })

    await gotoLearnerPage(page, '/learn/mod-01')
    await expect(page.getByText('Could not load your lesson progress right now.', { exact: true })).toBeVisible()
    await expect(page).toHaveURL('/learn/mod-01')
    await expect(page.getByRole('button', { name: 'Retry loading progress' })).toBeVisible()
  })

  test('distinguishes a leaderboard service failure from an empty leaderboard', async ({ page }) => {
    await page.route('**/api/leaderboard**', async route => {
      if (new URL(route.request().url()).searchParams.has('mine')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ challengeIds: [] }),
        })
        return
      }
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Could not load the leaderboard right now.' }),
      })
    })

    await gotoLearnerPage(page, '/challenge')
    await expect(page.getByRole('alert')).toHaveText('Could not load the leaderboard right now.')
    await expect(page.getByText('No scores yet this week — be the first to complete the challenge.')).toHaveCount(0)
  })

  test('does not leave a challenge marked complete when recording points fails', async ({ page }) => {
    await page.route('**/api/leaderboard**', async route => {
      const request = route.request()
      if (request.method() === 'POST') {
        await route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Could not save your challenge points right now.' }),
        })
        return
      }

      const isPersonalHistory = new URL(request.url()).searchParams.has('mine')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isPersonalHistory ? { challengeIds: [] } : { entries: [] }),
      })
    })

    await gotoLearnerPage(page, '/challenge')
    const completeButton = page.getByRole('button', { name: /Mark Complete/ })
    await completeButton.click()
    await expect(page.getByRole('alert')).toHaveText('Could not save your challenge points right now.')
    await expect(page.getByRole('button', { name: /Mark Complete/ })).toBeVisible()
  })

  test('offers quiz feedback and lets a learner retry before completing the Git sandbox', async ({ page }) => {
    await gotoLearnerPage(page, '/learn/mod-01/mod-01-lesson-01')
    await expect(page.getByRole('button', { name: /Continue to quiz/ })).toBeEnabled()
    await page.getByRole('button', { name: /Continue to quiz/ }).click()

    await page.getByRole('button', { name: 'A website for hosting code' }).click()
    await expect(page.getByText('Not quite.', { exact: false })).toBeVisible()
    await expect(page.getByText(/Retry hint:/)).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Try again' }).click()

    await page.getByRole('button', { name: 'A version control system that tracks changes to files over time' }).click()
    await page.getByRole('button', { name: 'Next question' }).click()
    await page.getByRole('button', { name: 'A cloud-hosting service for repositories that use Git underneath' }).click()
    await page.getByRole('button', { name: /Continue to sandbox/ }).click()
    await expectAccessible(page)

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
    await gotoLearnerPage(page, '/learn/mod-01/mod-01-lesson-07')
    await page.getByRole('button', { name: /Continue to quiz/ }).click()
    await page.getByRole('button', { name: 'main' }).click()
    await page.getByRole('button', { name: /Continue to sandbox/ }).click()
    await expectAccessible(page)

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
    await gotoLearnerPage(page, '/learn/mod-08/mod-08-lesson-02')
    await page.getByRole('button', { name: /Continue to quiz/ }).click()
    await page.getByRole('button', { name: '.github/workflows/' }).click()
    await page.getByRole('button', { name: /Continue to sandbox/ }).click()

    await page.getByRole('button', { name: 'Validate workflow' }).click()
    await expect(page.getByText(/Save the workflow at \.github\/workflows\/ci\.yml/)).toBeVisible()
    await expect(page.getByText(/Why it matters:/)).toBeVisible()
    await expectAccessible(page)

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

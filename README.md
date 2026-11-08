# DevFlow Academy

**Master Git and real-world development workflows — through practice, not just theory.**

A free, interactive platform to help developers (especially new grads and self-taught engineers) truly understand and master Git — the way industry professionals use it every day.


## The Problem

Many Computer Science graduates finish university with strong theoretical knowledge but still struggle with essential tools like Git. They can explain concepts but freeze when it comes to real workflows — branching strategies, resolving merge conflicts, rebasing, or collaborating effectively in a team.

We believe **practical practice beats passive learning**.

## Our Solution

DevFlow Academy combines **bite-sized lessons** with **interactive, real-world exercises** in a safe environment. Think Duolingo meets Git — gamified, habit-forming, and completely free.

### Key Features
- **Interactive Git Playground** — Practice real commands without fear of breaking anything
- **Structured Learning Paths** — From absolute beginner to advanced workflows
- **Realistic Scenarios** — Merge conflicts, pull requests, monorepos, CI/CD integration, and more
- **Progress Tracking & Streaks** — Built to help you build consistent learning habits
- **Community Challenges** — Learn together with others
- **100% Free Forever** — No paywalls, no premium tiers

**No payment or AI API key is required to take the course or complete lessons.** Gitter Lite is free to use.
Gitter's optional AI mode uses a provider key and may be subject to that provider's own limits or charges.

## Why We Built This

After seeing friends graduate with CompSci degrees yet still struggle with Git, I decided to take action. Having learned Git hands-on from day one at **WeThinkCode**, I knew the value of practical, work-simulated training.

So instead of just sharing resources, we’re building a platform that makes learning Git feel natural, engaging, and effective.

## Tech Stack

- **Frontend**: Next.js / React (TypeScript)
- **Backend**: (To be confirmed — likely Node.js / NestJS or Python FastAPI)
- **Interactive Terminal**: xterm.js + custom backend simulation
- **Styling**: Tailwind CSS
- **Database**: (TBD)

## Quality Checks

Run the unit tests, lint, and TypeScript checks with `npm test`, `npm run lint`, and `npm run typecheck`.

Browser-based learner journey tests use Playwright. Install its Chromium browser once with `npx playwright install chromium`, then run `npm run test:e2e`. These tests use mocked API responses and do not require a real account or backend services. CI runs all checks on pull requests.

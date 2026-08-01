/**
 * ============================================================================
 * gittoLite.ts
 * ============================================================================
 *
 * Rule-based knowledge base for Gitto — the admin/account helper. Same
 * keyword-scoring approach as gitterLite.ts, but scoped entirely to
 * account, settings, and privacy questions instead of Git itself. That's
 * Gitter's job — Gitto sticks to "how do I..." questions about the site.
 * ============================================================================
 */


interface LiteEntry {
  keywords: string[]
  answer: string
}

const GITTO_KNOWLEDGE: LiteEntry[] = [
  {
    keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'color scheme', 'colours', 'colors'],
    answer:
      "Head to Settings (top nav, or /settings) and pick a card under Appearance — Original, Light, or Dark. It's saved to this browser, so it'll stick around on your next visit here.",
  },
  {
    keywords: ['reset password', 'forgot password', 'change password', 'new password'],
    answer:
      "Right now DevFlow Academy signs in through GitHub only — email/password login is paused while a custom domain gets sorted out. If you signed up with GitHub, there's no separate DevFlow password to reset; just use 'Continue with GitHub'.",
  },
  {
    keywords: ['verify email', 'email verification', 'resend verification', 'confirm email', 'verified'],
    answer:
      "If you registered with email/password, a verification banner appears near the top of the site until you click the link we emailed you. There's a 'Resend email' button right on that banner if it didn't arrive. GitHub accounts are verified automatically.",
  },
  {
    keywords: ['connect github', 'link github', 'github profile', 'disconnect github', 'github username'],
    answer:
      "On your Progress dashboard, the 'GitHub Proof' card lets you connect a public GitHub username — it pulls your avatar, repo count, and followers to show as portfolio proof. Hit 'Disconnect' there any time to unlink it.",
  },
  {
    keywords: ['log out', 'logout', 'sign out', 'signout'],
    answer:
      "Click your avatar in the top-right, then the logout icon next to it. On mobile, open the menu and it's at the bottom under your name.",
  },
  {
    keywords: ['delete account', 'delete my data', 'remove my account', 'close my account'],
    answer:
      "There's no self-serve delete button yet — reach out through the Support page and it can be handled manually. Clearing your browser's local storage will disconnect Gitter AI and reset guest-only progress, but it won't touch your actual account or reviews.",
  },
  {
    keywords: ['what data', 'privacy', 'my data', 'stored', 'what do you store'],
    answer:
      "Short version: your account and course progress live on the server tied to your login; your theme choice and any Gitter AI key live only in this browser. Full details are on the Privacy page, linked in the footer.",
  },
  {
    keywords: ['gitter ai', 'api key', 'byok', 'gemini key', 'groq key', 'anthropic key'],
    answer:
      "That one's actually Gitter's department, not mine — open the Gitter chat bubble in the bottom-right corner and tap the key icon to add or manage your AI provider key.",
  },
  {
    keywords: ['why cant i log in with email', 'email login disabled', 'no email login', 'password login'],
    answer:
      "Email/password sign-in is temporarily paused while a stable custom domain gets set up for the GitHub OAuth callback — GitHub is the only sign-in path for now. It'll likely return once that's sorted.",
  },
  {
    keywords: ['who are you', 'what are you', 'what is gitto', 'gitto'],
    answer:
      "I'm Gitto 🐙 — I handle the boring-but-necessary admin stuff: account settings, theme, GitHub linking, privacy questions. For actual Git and GitHub teaching, that's Gitter's corner over on the right.",
  },
]

const FALLBACK_ANSWER =
  "That's outside my lane — I only handle account and settings questions. For Git, GitHub, or career questions, try Gitter in the bottom-right corner instead."

export function answerWithGittoLite(question: string): string {
  const q = question.toLowerCase()
  let best: { entry: LiteEntry; score: number } | null = null

  for (const entry of GITTO_KNOWLEDGE) {
    const score = entry.keywords.reduce((sum, kw) => sum + (q.includes(kw) ? kw.length : 0), 0)
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }

  return best ? best.entry.answer : FALLBACK_ANSWER
}
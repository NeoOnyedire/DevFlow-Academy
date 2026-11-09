/**
 * App.tsx
 *
 * Root component — sets up context providers and routes.
 * Global overlays (CurriculumPanel, AuthModal, ReviewModal, GitterHelper,
 * GittoHelper) live here so they persist and work on every page.
 *
 * Both the overlay group and the routed pages are wrapped in their own
 * <ErrorBoundary> — a throw in one no longer takes down the other. See
 * ErrorBoundary.tsx for why they use different fallback variants.
 *
 * Routes:
 *   /                      Landing page
 *   /learn                 Curriculum / lesson browser
 *   /practice              Commit scenes + scenario play
 *   /troubleshoot           Git error search tool
 *   /challenge              Repo Royale weekly challenge
 *   /dashboard              Progress, skills, GitHub, career mode
 *   /reviews                Full learner review list (landing page only teases 3)
 *   /settings                Account settings — profile + appearance/theme
 *   /about                  About DevFlow Academy
 *   /git-history             Behind-the-scenes engineering changelog
 *   /privacy                Privacy policy
 *   /terms                  Terms of use
 *   /support                Support / contact / socials
 *   /admin                  Admin dashboard — server-gated to one GitHub account (see api/_lib/admin.ts)
 *   /auth/github/callback   GitHub OAuth redirect target (no nav, brief only)
 *   /verify-email           Email verification link target (no nav, brief only)
 *   /reset-password         Password reset link target (no nav, brief only)
 *   *                       404 — real not-found page, not a silent LandingPage fallback
 */

import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Context providers
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'

// Global overlays — always mounted, shown/hidden via context
import AuthModal      from './components/AuthModal'
//import CurriculumPanel from './components/CurriculumTree'
import ReviewModal    from './components/ReviewModal'
import GitterHelper   from './components/GitterHelper'
import GittoHelper    from './components/GittoHelper'
import ErrorBoundary  from './components/ErrorBoundary'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LearnPage = lazy(() => import('./pages/LearnPage'))
const PracticePage = lazy(() => import('./pages/PracticePage'))
const TroubleshootPage = lazy(() => import('./pages/TroubleshootPage'))
const ChallengePage = lazy(() => import('./pages/ChallengePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const GitHistoryPage = lazy(() => import('./pages/GitHistoryPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const GitHubCallbackPage = lazy(() => import('./pages/GitHubCallbackPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function AppInner() {
  return (
    <>
      {/* Global overlays — isolated so a crash here doesn't take the page with it */}
      <ErrorBoundary label="overlay panel" variant="overlay">
        <AuthModal />
        <ReviewModal />
        <GitterHelper />
        <GittoHelper />
      </ErrorBoundary>

      {/* Page routes — isolated so a crash here doesn't take the overlays with it */}
      <ErrorBoundary label="page" variant="page">
        <Suspense fallback={<div role="status" className="min-h-screen flex items-center justify-center bg-espresso text-white">Loading page…</div>}>
          <Routes>
            <Route path="/"                     element={<LandingPage />} />
            <Route path="/learn"                element={<LearnPage />} />
            <Route path="/learn/:moduleId"      element={<LearnPage />} />
            <Route path="/learn/:moduleId/:lessonId" element={<LearnPage />} />
            <Route path="/practice"             element={<PracticePage />} />
            <Route path="/troubleshoot"         element={<TroubleshootPage />} />
            <Route path="/challenge"            element={<ChallengePage />} />
            <Route path="/dashboard"            element={<DashboardPage />} />
            <Route path="/reviews"              element={<ReviewsPage />} />
            <Route path="/settings"             element={<SettingsPage />} />
            <Route path="/about"                element={<AboutPage />} />
            <Route path="/git-history"          element={<GitHistoryPage />} />
            <Route path="/privacy"              element={<PrivacyPage />} />
            <Route path="/terms"                element={<TermsPage />} />
            <Route path="/support"              element={<SupportPage />} />
            <Route path="/admin"                element={<AdminPage />} />
            <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
            <Route path="/verify-email"         element={<VerifyEmailPage />} />
            <Route path="/reset-password"       element={<ResetPasswordPage />} />
            {/* Fallback — real 404, not a silent LandingPage render */}
            <Route path="*"                     element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppInner />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

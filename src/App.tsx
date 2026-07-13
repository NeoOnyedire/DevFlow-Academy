/**
 * App.tsx
 *
 * Root component — sets up context providers and routes.
 * Global overlays (CurriculumPanel, AuthModal, ReviewModal, GitterHelper)
 * live here so they persist and work on every page.
 *
 * Routes:
 *   /                      Landing page
 *   /learn                 Curriculum / lesson browser
 *   /practice              Commit scenes + scenario play
 *   /troubleshoot           Git error search tool
 *   /challenge              Repo Royale weekly challenge
 *   /dashboard              Progress, skills, GitHub, career mode
 *   /about                  About DevFlow Academy
 *   /privacy                Privacy policy
 *   /terms                  Terms of use
 *   /support                Support / contact / socials
 *   /auth/github/callback   GitHub OAuth redirect target (no nav, brief only)
 *   /verify-email           Email verification link target (no nav, brief only)
 *   /reset-password         Password reset link target (no nav, brief only)
 */

import { Routes, Route } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Context providers
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'

// Global overlays — always mounted, shown/hidden via context
import AuthModal      from './components/AuthModal'
import CurriculumPanel from './components/CurriculumPanel'
import ReviewModal    from './components/ReviewModal'
import GitterHelper   from './components/GitterHelper'

// Pages
import LandingPage        from './pages/LandingPage'
import LearnPage          from './pages/LearnPage'
import PracticePage       from './pages/PracticePage'
import TroubleshootPage   from './pages/TroubleshootPage'
import ChallengePage      from './pages/ChallengePage'
import DashboardPage      from './pages/DashboardPage'
import AboutPage          from './pages/AboutPage'
import PrivacyPage        from './pages/PrivacyPage'
import TermsPage          from './pages/TermsPage'
import SupportPage        from './pages/SupportPage'
import GitHubCallbackPage from './pages/GitHubCallbackPage'
import VerifyEmailPage    from './pages/VerifyEmailPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'

gsap.registerPlugin(ScrollTrigger)

function AppInner() {
  return (
    <>
      {/* Global overlays */}
      <AuthModal />
      <CurriculumPanel />
      <ReviewModal />
      <GitterHelper />

      {/* Page routes */}
      <Routes>
        <Route path="/"                     element={<LandingPage />} />
        <Route path="/learn"                element={<LearnPage />} />
        <Route path="/practice"             element={<PracticePage />} />
        <Route path="/troubleshoot"         element={<TroubleshootPage />} />
        <Route path="/challenge"            element={<ChallengePage />} />
        <Route path="/dashboard"            element={<DashboardPage />} />
        <Route path="/about"                element={<AboutPage />} />
        <Route path="/privacy"              element={<PrivacyPage />} />
        <Route path="/terms"                element={<TermsPage />} />
        <Route path="/support"              element={<SupportPage />} />
        <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
        <Route path="/verify-email"         element={<VerifyEmailPage />} />
        <Route path="/reset-password"       element={<ResetPasswordPage />} />
        {/* Fallback */}
        <Route path="*"                     element={<LandingPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </AuthProvider>
  )
}

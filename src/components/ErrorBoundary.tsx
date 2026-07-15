/**
 * ErrorBoundary.tsx
 *
 * A component throw anywhere below one of these stops propagating past
 * it instead of taking down the whole app. Two usages in App.tsx:
 *   - variant="page"    wraps <Routes> — full-page fallback with a
 *                        "try again" / "go home" pair.
 *   - variant="overlay" wraps the always-mounted overlay group
 *                        (AuthModal, CurriculumPanel, ReviewModal,
 *                        GitterHelper) — a small floating toast, since
 *                        those components are themselves position:fixed
 *                        and a full-page fallback would look wrong here.
 *
 * React error boundaries must be class components — there's no hook
 * equivalent of componentDidCatch as of this writing.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Short label shown in the fallback and logged with the error, so it's obvious which boundary caught it. */
  label: string
  variant?: 'page' | 'overlay'
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.variant === 'overlay') {
      return (
        <div className="fixed bottom-4 left-4 z-[300] max-w-sm bg-[#4A2F2F] card-radius card-shadow p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FF4D6D] flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-display font-semibold text-white text-sm mb-1">Something went wrong</p>
            <p className="text-white/60 text-xs mb-3">
              The {this.props.label} hit an error. The rest of the page should still work.
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 text-xs font-accent uppercase tracking-wider text-[#F7B731] hover:text-[#f0ad28] transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-[#FF4D6D] mx-auto mb-4" />
          <p className="font-display font-bold text-white text-xl mb-2">Something went wrong</p>
          <p className="text-white/60 text-sm mb-6">
            This page hit an unexpected error. Try reloading it, or head back home.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 bg-white/10 text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <a
              href="/"
              className="bg-rose-punch text-white font-display font-semibold px-5 py-2.5 rounded-xl hover:bg-[#ff3d5d] transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    )
  }
}

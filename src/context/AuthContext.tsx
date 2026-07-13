/**
 * ============================================================================
 * AuthContext.tsx
 * ============================================================================
 *
 * Authentication context provider for DevFlow Academy.
 *
 * Accounts are now real, server-side records (see api/_lib/users.ts),
 * not localStorage. Two ways to sign in, both end the same way — a
 * signed, httpOnly session cookie set by the server:
 *
 * - Email + password — api/auth/register.ts and api/auth/login.ts.
 *   Passwords are hashed server-side (scrypt) before ever touching
 *   storage; this app never sees or stores a plaintext password after
 *   the initial request.
 * - GitHub OAuth — unchanged redirect flow (see githubOAuth.ts /
 *   GitHubCallbackPage.tsx), but api/auth/github.ts now creates or
 *   finds a real server-side account and signs the same kind of
 *   session cookie, instead of handing the browser a profile to store
 *   itself.
 *
 * On mount, this provider asks the server "who am I?" via
 * GET /api/auth/me (the cookie travels automatically) rather than
 * reading a cached user out of localStorage. This also means things
 * like "have I already submitted a review" are real, server-verified
 * facts tied to the account (user.hasReviewedCourse), not a flag that
 * resets when someone clears their browser.
 *
 * NOTE ON MIGRATION: accounts created under the old localStorage-based
 * system do not carry over — this is a genuinely different storage
 * backend. Existing test users will need to register again.
 * ============================================================================
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

/** User profile shape — mirrors the server's "safe" user (no password hash) */
export interface User {
  id: string
  name: string
  email: string
  provider: 'password' | 'github'
  githubUsername?: string
  avatarUrl?: string
  hasReviewedCourse: boolean
}

interface AuthResult {
  ok: boolean
  message: string
}

/** Auth context value exposed to consumers */
interface AuthContextValue {
  user: User | null
  isLoggedIn: boolean
  isLoadingUser: boolean
  isAuthModalOpen: boolean
  authModalMode: 'login' | 'register'
  login: (email: string, password: string) => Promise<AuthResult>
  register: (name: string, email: string, password: string) => Promise<AuthResult>
  loginWithGitHub: (code: string) => Promise<AuthResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** login/register/github all return the same { user } | { error } shape. */
async function parseAuthResponse(response: Response): Promise<{ user?: User; error?: string }> {
  try {
    return await response.json()
  } catch {
    return { error: 'Unexpected response from the server.' }
  }
}

/** Provider component — wrap the app with this */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // Auth modal visibility state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  /** Ask the server who the current session cookie belongs to, if anyone. */
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' })
      const data = await response.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    }
  }, [])

  // On mount: restore session from the cookie, not localStorage.
  useEffect(() => {
    refreshUser().finally(() => setIsLoadingUser(false))
  }, [refreshUser])

  /** Login handler — verifies against the server. Returns { ok, message }. */
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await parseAuthResponse(response)
      if (!response.ok || !data.user) {
        return { ok: false, message: data.error || 'Invalid email or password.' }
      }
      setUser(data.user)
      return { ok: true, message: 'Welcome back!' }
    } catch {
      return { ok: false, message: 'Could not reach the server. Please try again.' }
    }
  }, [])

  /** Register handler — creates a real server-side account. */
  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await parseAuthResponse(response)
      if (!response.ok || !data.user) {
        return { ok: false, message: data.error || 'Could not create your account.' }
      }
      setUser(data.user)
      return { ok: true, message: 'Account created!' }
    } catch {
      return { ok: false, message: 'Could not reach the server. Please try again.' }
    }
  }, [])

  /**
   * GitHub OAuth login — takes the one-time `code` GitHub sent back to
   * the callback page. The server exchanges it, finds-or-creates the
   * matching account, and signs a session cookie. No password anywhere
   * in this path.
   */
  const loginWithGitHub = useCallback(async (code: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/github', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await parseAuthResponse(response)
      if (!response.ok || !data.user) {
        return { ok: false, message: data.error || 'GitHub sign-in failed.' }
      }
      setUser(data.user)
      return { ok: true, message: `Signed in as @${data.user.githubUsername || data.user.name}.` }
    } catch {
      return { ok: false, message: 'Could not reach the server. Please try again.' }
    }
  }, [])

  /** Logout — clears the session cookie server-side and local state. */
  const logout = useCallback(async () => {
    setUser(null)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      // The UI has already logged out either way; the cookie will expire on its own.
    }
  }, [])

  /** Open the auth modal in a specific mode (login or register) */
  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }, [])

  /** Close the auth modal */
  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isLoadingUser,
      isAuthModalOpen,
      authModalMode,
      login,
      register,
      loginWithGitHub,
      logout,
      refreshUser,
      openAuthModal,
      closeAuthModal,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to consume auth context — throws if used outside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

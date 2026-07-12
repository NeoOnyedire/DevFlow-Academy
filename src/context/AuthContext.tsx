/**
 * ============================================================================
 * AuthContext.tsx
 * ============================================================================
 *
 * Authentication context provider for DevFlow Academy.
 * Manages user login state, credentials, and access control.
 *
 * Two ways to sign in:
 * - Email + password (original flow) — credentials stored in localStorage.
 *   Kept as-is for backward compatibility with existing accounts.
 * - GitHub OAuth (new) — no password ever touches this app. The browser
 *   redirects to GitHub, GitHub redirects back with a one-time code, and
 *   api/auth/github.ts exchanges that code server-side (where the client
 *   secret lives) for the user's public profile. See src/lib/githubOAuth.ts
 *   and src/pages/GitHubCallbackPage.tsx for the rest of that flow.
 *
 * All curriculum content requires login. Users must also leave a review
 * before marking the course as complete.
 * ============================================================================
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

/** User profile shape — minimal, no password stored in memory */
export interface User {
  id: string
  name: string
  email: string
  avatar: string // initials-based avatar color (fallback when no real image)
  provider?: 'password' | 'github' // absent = legacy password account
  githubUsername?: string
  avatarUrl?: string // real avatar image, e.g. from GitHub
}

interface GitHubProfileResponse {
  githubId: number
  username: string
  name: string
  email: string
  avatarUrl: string
  profileUrl: string
}

/** Auth context value exposed to consumers */
interface AuthContextValue {
  user: User | null
  isLoggedIn: boolean
  isAuthModalOpen: boolean
  authModalMode: 'login' | 'register'
  login: (email: string, password: string) => boolean
  register: (name: string, email: string, password: string) => boolean
  loginWithGitHub: (code: string) => Promise<{ ok: boolean; message: string }>
  logout: () => void
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Generate a deterministic color from a name string.
 * Used for avatar backgrounds so each user gets a unique color, and as a
 * fallback for GitHub users before/if their avatar image fails to load.
 */
function nameToColor(name: string): string {
  const colors = ['#FF4D6D', '#F7B731', '#3CCF4A', '#4A90D9', '#9B59B6', '#E67E22']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

/** Provider component — wrap the app with this */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Load user from localStorage on initial mount (persistent sessions)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('devflow_user')
    return saved ? JSON.parse(saved) : null
  })

  // Auth modal visibility state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  /**
   * Login handler — validates against stored users in localStorage.
   * Returns true on success, false on failure.
   */
  const login = useCallback((email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('devflow_users') || '[]')
    const found = users.find((u: { email: string; password: string; name: string }) =>
      u.email === email && u.password === password
    )
    if (found) {
      const userObj: User = {
        id: btoa(email),
        name: found.name,
        email: found.email,
        avatar: nameToColor(found.name),
        provider: 'password',
      }
      setUser(userObj)
      localStorage.setItem('devflow_user', JSON.stringify(userObj))
      return true
    }
    return false
  }, [])

  /**
   * Register handler — creates a new user account.
   * Returns true on success, false if email already exists.
   */
  const register = useCallback((name: string, email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('devflow_users') || '[]')
    // Prevent duplicate registrations
    if (users.some((u: { email: string }) => u.email === email)) return false

    users.push({ name, email, password })
    localStorage.setItem('devflow_users', JSON.stringify(users))

    // Auto-login after registration
    const userObj: User = {
      id: btoa(email),
      name,
      email,
      avatar: nameToColor(name),
      provider: 'password',
    }
    setUser(userObj)
    localStorage.setItem('devflow_user', JSON.stringify(userObj))
    return true
  }, [])

  /**
   * GitHub OAuth login — takes the one-time `code` GitHub sent back to
   * the callback page, has the server exchange it for a profile, and
   * creates a session from that. No password anywhere in this path.
   *
   * The user's id is namespaced (`github:<id>`) so it never collides with
   * a password-account id, and stays stable across future GitHub logins
   * so progress keeps working (progress is keyed to user.id elsewhere).
   */
  const loginWithGitHub = useCallback(async (code: string): Promise<{ ok: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await response.json()

      if (!response.ok) {
        return { ok: false, message: data.message || data.error || 'GitHub sign-in failed.' }
      }

      const gh = data.user as GitHubProfileResponse
      const userObj: User = {
        id: `github:${gh.githubId}`,
        name: gh.name,
        email: gh.email,
        avatar: nameToColor(gh.name),
        provider: 'github',
        githubUsername: gh.username,
        avatarUrl: gh.avatarUrl,
      }

      setUser(userObj)
      localStorage.setItem('devflow_user', JSON.stringify(userObj))
      return { ok: true, message: `Signed in as @${gh.username}.` }
    } catch {
      return { ok: false, message: 'Could not reach the server. Please try again.' }
    }
  }, [])

  /** Logout — clears all auth state */
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('devflow_user')
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
      isAuthModalOpen,
      authModalMode,
      login,
      register,
      loginWithGitHub,
      logout,
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

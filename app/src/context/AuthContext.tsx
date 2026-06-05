/**
 * ============================================================================
 * AuthContext.tsx
 * ============================================================================
 *
 * Authentication context provider for DevFlow Academy.
 * Manages user login state, credentials, and access control.
 *
 * Features:
 * - Login / Register modal flow
 * - Persistent auth state (localStorage)
 * - User profile (name, email, avatar)
 * - Logout functionality
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
  avatar: string // initials-based avatar color
}

/** Auth context value exposed to consumers */
interface AuthContextValue {
  user: User | null
  isLoggedIn: boolean
  isAuthModalOpen: boolean
  authModalMode: 'login' | 'register'
  login: (email: string, password: string) => boolean
  register: (name: string, email: string, password: string) => boolean
  logout: () => void
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Generate a deterministic color from a name string.
 * Used for avatar backgrounds so each user gets a unique color.
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
    }
    setUser(userObj)
    localStorage.setItem('devflow_user', JSON.stringify(userObj))
    return true
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

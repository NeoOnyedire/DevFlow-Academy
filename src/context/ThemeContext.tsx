/**
 * ThemeContext.tsx
 *
 * Site-wide appearance setting: 'original' (current brand look),
 * 'light', or 'dark'. Persisted to localStorage and applied as a
 * data-theme attribute on <html>, which index.css uses to swap the
 * underlying --espresso / --card-dark / --card-light CSS variables
 * (plus a handful of literal-hex utility classes used by modals) —
 * see the "THEME SYSTEM" block at the bottom of index.css.
 *
 * Available to guests and logged-in users alike; it's a device
 * preference, not an account setting, so it doesn't require auth.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type ThemeMode = 'original' | 'light' | 'dark'

const STORAGE_KEY = 'devflow_theme'
const VALID_THEMES: ThemeMode[] = ['original', 'light', 'dark']

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'original'
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  return saved && VALID_THEMES.includes(saved) ? saved : 'original'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook to consume theme context — throws if used outside ThemeProvider */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
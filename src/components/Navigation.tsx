/**
 * ============================================================================
 * Navigation.tsx
 * ============================================================================
 *
 * Top navigation bar. Appears after scrolling past the hero section.
 *
 * Link behaviour (each link does something meaningfully different):
 *
 *   Curriculum → opens the panel with no module pre-selected, landing
 *                the user on the full module sidebar so they can browse
 *                the whole course at a glance. Good for orientation.
 *
 *   Lessons    → opens the panel jumped directly to the user's next
 *                incomplete module (or mod-01 for guests). Skips browsing
 *                and puts the user straight in front of a video.
 *
 *   Simulator  → scrolls to the CommitScenes / ScenarioPlay sections.
 *
 *   Progress   → scrolls to the Dashboard section.
 *
 * Mobile menu z-index (z-[150]) sits above the Gitter helper (z-[140])
 * so the dropdown is never obscured by the floating chat button.
 * ============================================================================
 */

import { useState, useCallback } from 'react'
import gsap from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { GitBranch, LogIn, LogOut, Menu, X, GraduationCap, BookOpen } from 'lucide-react'

gsap.registerPlugin(ScrollToPlugin)

export default function Navigation() {
  const { user, isLoggedIn, logout, openAuthModal } = useAuth()
  const { openCurriculum, modules, completedModules } = useApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      gsap.to(window, {
        scrollTo: { y: el, offsetY: 80 },
        duration: 0.6,
        ease: 'power2.out',
      })
      setMobileMenuOpen(false)
    }
  }, [])

  /**
   * "Curriculum" — browse mode.
   * Opens the panel without jumping to a specific module. The sidebar
   * module list is visible and the user can pick where to start.
   */
  const handleOpenCurriculum = useCallback(() => {
    openCurriculum()
    setMobileMenuOpen(false)
  }, [openCurriculum])

  /**
   * "Lessons" — jump-in mode.
   * Finds the first module the user hasn't completed and opens the panel
   * there directly. For guests, defaults to mod-01.
   * This is the "get me back to where I was" action.
   */
  const handleOpenNextLesson = useCallback(() => {
    const nextModule = modules.find(m => !completedModules.includes(m.id))
    openCurriculum(nextModule?.id ?? 'mod-01')
    setMobileMenuOpen(false)
  }, [openCurriculum, modules, completedModules])

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  return (
    <>
      <nav
        className="w-full px-4 md:px-[6vw] py-3 md:py-4 flex items-center justify-between relative"
        style={{ backgroundColor: 'rgba(107, 76, 76, 0.95)', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo — scrolls back to top */}
        <button
          onClick={() => scrollToSection('hero')}
          className="flex items-center gap-2 group"
        >
          <GitBranch className="w-5 h-5 md:w-6 md:h-6 text-[#F7B731] transition-transform group-hover:rotate-12" />
          <span className="font-display text-lg md:text-xl font-semibold text-white tracking-wide">
            DevFlow Academy
          </span>
        </button>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-6">

          {/* Curriculum — browse the full module list */}
          <button
            onClick={handleOpenCurriculum}
            className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-[#F7B731] transition-colors"
            title="Browse all modules"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Curriculum
          </button>

          {/* Lessons — jump straight to next unwatched video */}
          <button
            onClick={handleOpenNextLesson}
            className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors"
            title={isLoggedIn ? 'Continue where you left off' : 'Start lesson 1'}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {isLoggedIn && completedModules.length > 0 ? 'Continue' : 'Lessons'}
          </button>

          <button
            onClick={() => scrollToSection('commit-scenes')}
            className="font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors"
          >
            Simulator
          </button>

          <button
            onClick={() => scrollToSection('dashboard')}
            className="font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors"
          >
            Progress
          </button>

          {/* Auth */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: user.avatar }}
              >
                <span className="font-display font-bold text-white text-xs">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-white/40 hover:text-white transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em]
                bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </button>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          className="md:hidden text-white/70 hover:text-white transition-colors p-2"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* ── Mobile dropdown ──
          Rendered outside <nav> so it can use a fixed position and a real
          z-index that sits above the Gitter helper (z-[140]).
          A full-screen backdrop sits behind the menu and closes it on tap,
          which also prevents accidental taps on the Gitter button below. */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop — closes menu when tapped, covers Gitter */}
          <div
            className="fixed inset-0 z-[145] md:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Menu panel — above backdrop and Gitter */}
          <div
            className="fixed top-[52px] left-0 right-0 z-[150] md:hidden
              bg-[#4A2F2F] border-t border-white/10 p-4
              flex flex-col gap-1 shadow-2xl animate-[fadeIn_0.15s_ease-out]"
          >
            {/* Curriculum — browse */}
            <button
              onClick={handleOpenCurriculum}
              className="flex items-center gap-3 font-accent text-xs uppercase tracking-[0.14em]
                text-white/70 hover:text-[#F7B731] hover:bg-white/5 transition-colors
                py-3 px-2 rounded-lg text-left w-full"
            >
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span>Curriculum</span>
              <span className="ml-auto text-[10px] text-white/30 normal-case tracking-normal font-sans">Browse all modules</span>
            </button>

            {/* Lessons — jump to next */}
            <button
              onClick={handleOpenNextLesson}
              className="flex items-center gap-3 font-accent text-xs uppercase tracking-[0.14em]
                text-white/70 hover:text-white hover:bg-white/5 transition-colors
                py-3 px-2 rounded-lg text-left w-full"
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span>{isLoggedIn && completedModules.length > 0 ? 'Continue' : 'Lessons'}</span>
              <span className="ml-auto text-[10px] text-white/30 normal-case tracking-normal font-sans">
                {isLoggedIn && completedModules.length > 0 ? 'Pick up where you left off' : 'Start from lesson 1'}
              </span>
            </button>

            <button
              onClick={() => scrollToSection('commit-scenes')}
              className="flex items-center gap-3 font-accent text-xs uppercase tracking-[0.14em]
                text-white/70 hover:text-white hover:bg-white/5 transition-colors
                py-3 px-2 rounded-lg text-left w-full"
            >
              Simulator
            </button>

            <button
              onClick={() => scrollToSection('dashboard')}
              className="flex items-center gap-3 font-accent text-xs uppercase tracking-[0.14em]
                text-white/70 hover:text-white hover:bg-white/5 transition-colors
                py-3 px-2 rounded-lg text-left w-full"
            >
              Progress
            </button>

            {/* Mobile auth */}
            <div className="border-t border-white/10 pt-3 mt-2">
              {isLoggedIn && user ? (
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: user.avatar }}
                    >
                      <span className="font-display font-bold text-white text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-white text-sm">{user.name}</span>
                  </div>
                  <button
                    onClick={() => { logout(); closeMobileMenu() }}
                    className="text-white/40 hover:text-white transition-colors p-1"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal('login')
                    closeMobileMenu()
                  }}
                  className="w-full flex items-center justify-center gap-2 font-accent text-xs uppercase tracking-[0.14em]
                    bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login / Join Free
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

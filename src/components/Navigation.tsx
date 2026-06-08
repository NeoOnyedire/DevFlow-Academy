/**
 * ============================================================================
 * Navigation.tsx
 * ============================================================================
 *
 * Top navigation bar with DevFlow Academy branding, section links, and auth controls.
 * Appears after scrolling past the hero section.
 *
 * Features:
 * - Logo with Gitter icon (scrolls to hero)
 * - Section links (Lessons, Simulator, Progress)
 * - Auth button (Login/Register or user avatar + Logout)
 * - Mobile hamburger menu for small screens
 * - Glass-morphism background with blur
 * ============================================================================
 */

import { useState, useCallback } from 'react'
import gsap from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { GitBranch, LogIn, LogOut, Menu, X, GraduationCap } from 'lucide-react'

gsap.registerPlugin(ScrollToPlugin)

export default function Navigation() {
  const { user, isLoggedIn, logout, openAuthModal } = useAuth()
  const { openCurriculum } = useApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /** Scroll to section using GSAP (respects snap points) */
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

  return (
    <nav className="w-full px-4 md:px-[6vw] py-3 md:py-4 flex items-center justify-between relative"
      style={{ backgroundColor: 'rgba(107, 76, 76, 0.95)', backdropFilter: 'blur(12px)' }}>
      {/* Logo */}
      <button
        onClick={() => scrollToSection('hero')}
        className="flex items-center gap-2 group"
      >
        <GitBranch className="w-5 h-5 md:w-6 md:h-6 text-[#F7B731] transition-transform group-hover:rotate-12" />
        <span className="font-display text-lg md:text-xl font-semibold text-white tracking-wide">
          DevFlow Academy
        </span>
      </button>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-6">
        <button
          onClick={() => openCurriculum()}
          className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-[#F7B731] transition-colors"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Curriculum
        </button>
        <button
          onClick={() => scrollToSection('learn-grid')}
          className="font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors"
        >
          Lessons
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

        {/* Auth section */}
        {isLoggedIn && user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: user.avatar }}>
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

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-white/70 hover:text-white transition-colors p-2"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#4A2F2F] border-t border-white/10 p-4 md:hidden
          flex flex-col gap-3 shadow-xl animate-[fadeIn_0.15s_ease-out]">
          <button
            onClick={() => openCurriculum()}
            className="flex items-center gap-2 font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-[#F7B731] transition-colors py-2"
          >
            <GraduationCap className="w-4 h-4" />
            Curriculum
          </button>
          <button
            onClick={() => scrollToSection('learn-grid')}
            className="font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors py-2 text-left"
          >
            Lessons
          </button>
          <button
            onClick={() => scrollToSection('commit-scenes')}
            className="font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors py-2 text-left"
          >
            Simulator
          </button>
          <button
            onClick={() => scrollToSection('dashboard')}
            className="font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors py-2 text-left"
          >
            Progress
          </button>

          {/* Mobile auth */}
          <div className="border-t border-white/10 pt-3 mt-1">
            {isLoggedIn && user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: user.avatar }}>
                    <span className="font-display font-bold text-white text-xs">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <span className="text-white text-sm">{user.name}</span>
                </div>
                <button onClick={logout} className="text-white/40 hover:text-white transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openAuthModal('login')
                  setMobileMenuOpen(false)
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
      )}
    </nav>
  )
}

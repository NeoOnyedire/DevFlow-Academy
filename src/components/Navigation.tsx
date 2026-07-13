/**
 * Navigation.tsx
 *
 * Uses react-router-dom NavLink for page navigation.
 * Active route gets highlighted automatically via NavLink's isActive.
 *
 * Links:
 *   Logo          → /          (landing)
 *   Curriculum    → /learn     (browse all modules)
 *   Lessons       → /learn     (opens curriculum panel at next module)
 *   Fix an Error  → /troubleshoot
 *   Practice      → /practice
 *   Progress      → /dashboard
 *   Challenge     → /challenge
 *
 * User avatar shows the real GitHub profile photo when the person signed
 * in via GitHub OAuth (user.avatarUrl), falling back to a colored-initials
 * circle otherwise. That fallback color is now computed on the fly via
 * nameToColor() rather than stored on the account — it's purely cosmetic
 * and always derivable from the name, so there's no reason to persist it
 * server-side.
 */

import { useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { nameToColor } from '../lib/avatarColor'
import { GitBranch, LogIn, LogOut, Menu, X, GraduationCap, BookOpen, Wrench, Zap, LayoutDashboard } from 'lucide-react'

export default function Navigation() {
  const { user, isLoggedIn, logout, openAuthModal } = useAuth()
  const { openCurriculum, modules, completedModules } = useApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  const handleOpenNextLesson = useCallback(() => {
    const nextModule = modules.find(m => !completedModules.includes(m.id))
    openCurriculum(nextModule?.id ?? 'mod-01')
    closeMobileMenu()
  }, [openCurriculum, modules, completedModules, closeMobileMenu])

  const handleOpenCurriculum = useCallback(() => {
    openCurriculum()
    closeMobileMenu()
  }, [openCurriculum, closeMobileMenu])

  const lessonLabel = isLoggedIn && completedModules.length > 0 ? 'Continue' : 'Lessons'

  // NavLink active class helper
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-accent text-xs uppercase tracking-[0.14em] transition-colors ${
      isActive ? 'text-[#F7B731]' : 'text-white/70 hover:text-white'
    }`

  return (
    <>
      <nav
        className="w-full px-4 md:px-[6vw] py-3 md:py-4 flex items-center justify-between relative"
        style={{ backgroundColor: 'rgba(107,76,76,0.97)', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <GitBranch className="w-5 h-5 md:w-6 md:h-6 text-[#F7B731] transition-transform group-hover:rotate-12" />
          <span className="font-display text-lg md:text-xl font-semibold text-white tracking-wide">
            DevFlow Academy
          </span>
        </NavLink>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {/* Curriculum — opens panel in browse mode */}
          <button
            onClick={handleOpenCurriculum}
            className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-[#F7B731] transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" /> Curriculum
          </button>

          {/* Lessons — jumps to next unwatched module */}
          <button
            onClick={handleOpenNextLesson}
            className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] text-white/70 hover:text-white transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" /> {lessonLabel}
          </button>

          <NavLink to="/troubleshoot" className={({ isActive }) =>
            `flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] transition-colors ${isActive ? 'text-[#F7B731]' : 'text-white/70 hover:text-[#F7B731]'}`
          }>
            <Wrench className="w-3.5 h-3.5" /> Fix an Error
          </NavLink>

          <NavLink to="/practice" className={linkClass}>Practice</NavLink>

          <NavLink to="/challenge" className={({ isActive }) =>
            `flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] transition-colors ${isActive ? 'text-[#F7B731]' : 'text-white/70 hover:text-white'}`
          }>
            <Zap className="w-3.5 h-3.5" /> Challenge
          </NavLink>

          <NavLink to="/dashboard" className={({ isActive }) =>
            `flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em] transition-colors ${isActive ? 'text-[#F7B731]' : 'text-white/70 hover:text-white'}`
          }>
            <LayoutDashboard className="w-3.5 h-3.5" /> Progress
          </NavLink>

          {/* Auth */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: nameToColor(user.name) }}
                title={user.githubUsername ? `@${user.githubUsername}` : user.name}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-white text-xs">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <button onClick={logout} className="text-white/40 hover:text-white transition-colors" title="Log out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-[0.14em]
                bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" /> Login
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          className="md:hidden text-white/70 hover:text-white transition-colors p-2"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-[145] md:hidden" onClick={closeMobileMenu} aria-hidden="true" />
          <div className="fixed top-[52px] left-0 right-0 z-[150] md:hidden
            bg-[#4A2F2F] border-t border-white/10 p-4 flex flex-col gap-1 shadow-2xl animate-[fadeIn_0.15s_ease-out]">

            <button onClick={handleOpenCurriculum}
              className="flex items-center gap-3 py-3 px-2 rounded-lg text-white/70 hover:text-[#F7B731] hover:bg-white/5 transition-colors text-left w-full font-accent text-xs uppercase tracking-[0.14em]">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span>Curriculum</span>
              <span className="ml-auto text-[10px] text-white/30 normal-case tracking-normal font-sans">Browse all modules</span>
            </button>

            <button onClick={handleOpenNextLesson}
              className="flex items-center gap-3 py-3 px-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left w-full font-accent text-xs uppercase tracking-[0.14em]">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span>{lessonLabel}</span>
              <span className="ml-auto text-[10px] text-white/30 normal-case tracking-normal font-sans">
                {isLoggedIn && completedModules.length > 0 ? 'Pick up where you left off' : 'Start from lesson 1'}
              </span>
            </button>

            {[
              { to: '/troubleshoot', icon: Wrench,          label: 'Fix an Error', hint: 'Search Git errors'     },
              { to: '/practice',     icon: BookOpen,         label: 'Practice',    hint: 'Scenarios & simulator' },
              { to: '/challenge',    icon: Zap,              label: 'Challenge',   hint: 'Weekly Repo Royale'    },
              { to: '/dashboard',    icon: LayoutDashboard,  label: 'Progress',    hint: 'Skills & career mode'  },
            ].map(({ to, icon: Icon, label, hint }) => (
              <NavLink key={to} to={to} onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 px-2 rounded-lg transition-colors text-left w-full font-accent text-xs uppercase tracking-[0.14em]
                  ${isActive ? 'text-[#F7B731] bg-white/5' : 'text-white/70 hover:text-white hover:bg-white/5'}`
                }>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                <span className="ml-auto text-[10px] text-white/30 normal-case tracking-normal font-sans">{hint}</span>
              </NavLink>
            ))}

            <div className="border-t border-white/10 pt-3 mt-2">
              {isLoggedIn && user ? (
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: nameToColor(user.name) }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-white text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <span className="text-white text-sm">{user.name}</span>
                  </div>
                  <button onClick={() => { logout(); closeMobileMenu() }}
                    className="text-white/40 hover:text-white transition-colors p-1">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { openAuthModal('login'); closeMobileMenu() }}
                  className="w-full flex items-center justify-center gap-2 font-accent text-xs uppercase tracking-[0.14em]
                    bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg transition-colors">
                  <LogIn className="w-3.5 h-3.5" /> Login / Join Free
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

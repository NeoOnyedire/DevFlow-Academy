/**
 * SettingsPage.tsx  —  /settings
 *
 * Account settings: profile summary + appearance (theme) picker.
 * Theme choice is a device preference (persisted via ThemeContext),
 * available to guests and logged-in users alike; the profile card
 * only shows real data when signed in.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import { useAuth } from '../context/AuthContext'
import { useTheme, type ThemeMode } from '../context/ThemeContext'
import { Settings, User, Sun, Moon, Sparkles, Check, Github, Mail, LogIn } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const THEME_OPTIONS: { id: ThemeMode; label: string; tagline: string; icon: typeof Sun; swatches: string[] }[] = [
  {
    id: 'original',
    label: 'Original',
    tagline: 'The classic DevFlow look — warm espresso brown, sunshine yellow, rose-punch accents.',
    icon: Sparkles,
    swatches: ['#6B4C4C', '#4A2F2F', '#F7B731', '#FF4D6D'],
  },
  {
    id: 'light',
    label: 'Light Mode',
    tagline: 'Clean and bright — off-white surfaces, high-contrast text, same brand accents.',
    icon: Sun,
    swatches: ['#F8F9FA', '#FFFFFF', '#F7B731', '#FF4D6D'],
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    tagline: 'Near-black canvas with a slow-drifting aurora glow and neon-edged cards.',
    icon: Moon,
    swatches: ['#0A0B10', '#14161F', '#FFC94D', '#FF4D6D'],
  },
]

export default function SettingsPage() {
  const { isLoggedIn, user } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 md:py-24 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-[#F7B731]" />
              <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">Account Settings</span>
            </div>
            <h1 className="font-display font-bold text-white tracking-[0.02em] leading-none"
              style={{ fontSize: 'clamp(34px, 5.5vw, 60px)' }}>
              Settings
            </h1>
          </div>
          <img src="/gittosettings.png" alt="Gitto ready to help with your settings"
            className="hidden sm:block w-28 md:w-36 h-auto flex-shrink-0" />
        </div>

        {/* Profile summary */}
        <div className="bg-card-dark card-radius card-outline p-5 md:p-6 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-white/50" />
            <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/50">Profile</span>
          </div>

          {isLoggedIn && user ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[#F7B731]/20 flex items-center justify-center flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-white text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-white text-lg">{user.name}</p>
                <p className="text-white/50 text-sm flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </p>
                {user.githubUsername && (
                  <p className="text-white/50 text-sm flex items-center gap-1.5 mt-0.5">
                    <Github className="w-3.5 h-3.5" /> @{user.githubUsername}
                  </p>
                )}
              </div>
              <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-accent font-semibold uppercase tracking-wider bg-white/10 text-white/60">
                {user.provider === 'github' ? 'GitHub sign-in' : 'Email sign-in'}
              </span>
            </div>
          ) : (
            <p className="text-white/50 text-sm">
              You're not signed in — theme preferences below still work and are saved to this device.
            </p>
          )}
        </div>

        {/* Appearance / theme picker */}
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/50" />
          <span className="font-accent text-[10px] uppercase tracking-[0.14em] text-white/50">Appearance</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-4">
          {THEME_OPTIONS.map(option => {
            const Icon = option.icon
            const isActive = theme === option.id
            return (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`text-left p-5 rounded-2xl border-2 transition-all ${
                  isActive
                    ? 'border-[#F7B731] bg-white/10'
                    : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isActive ? 'bg-[#F7B731]' : 'bg-white/10'}`}>
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#2A2A2A]' : 'text-white/60'}`} />
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-accent uppercase tracking-wider text-[#F7B731]">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>
                <p className="font-display font-bold text-white text-lg mb-1.5">{option.label}</p>
                <p className="text-white/55 text-xs leading-relaxed mb-4">{option.tagline}</p>
                <div className="flex gap-1.5">
                  {option.swatches.map(color => (
                    <span key={color} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-white/35 text-xs leading-relaxed">
          Your theme choice is saved to this browser. Gitter's chat bubble stays rose-pink and Gitto's stays teal
          in every theme, so they're always easy to spot.
        </p>

        {!isLoggedIn && (
          <div className="mt-10 flex items-center gap-2 text-white/40 text-sm">
            <LogIn className="w-4 h-4" />
            Sign in from the nav bar to see your account profile here.
          </div>
        )}
      </section>
    </PageWrapper>
  )
}
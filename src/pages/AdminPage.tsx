/**
 * AdminPage.tsx  —  /admin
 *
 * Not linked in nav for anyone but the admin (cosmetic gate in
 * Navigation.tsx). The real gate is server-side: every fetch here hits
 * /api/admin/*, which 403s unless the session belongs to the GitHub
 * account configured in api/_lib/admin.ts.
 */
import { useEffect, useState, useCallback } from 'react'
import PageWrapper from '../components/PageWrapper'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert, Users, MessageCircle, Trophy, Trash2, RotateCcw } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  provider: 'password' | 'github'
  githubUsername?: string
  hasReviewedCourse: boolean
  emailVerified: boolean
  createdAt: string
}

interface AdminReview {
  id: string | null
  rawIndex: number
  rating: number
  comment: string
  date: string
  userName: string
}

interface LeaderboardRow {
  id: number
  user_id: string
  user_name: string
  points: number
  week_key: string
  challenge_id: string
  created_at: string
}

interface Stats {
  totalUsers: number
  usersWithProgress: number
  totalLessonRows: number
  totalLeaderboardEntries: number
  totalReviews: number
}

async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/admin/${path}`, { credentials: 'same-origin', ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export default function AdminPage() {
  const { isLoggedIn, user } = useAuth()
  const [forbidden, setForbidden] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [message, setMessage] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [isBackfilling, setIsBackfilling] = useState(false)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setForbidden(false)
    try {
      const [s, u, r, l] = await Promise.all([
        adminFetch('stats'),
        adminFetch('users'),
        adminFetch('reviews'),
        adminFetch('leaderboard'),
      ])
      setStats(s)
      setUsers(u.users)
      setReviews(r.reviews)
      setLeaderboard(l.entries)
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('authorized')) setForbidden(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleDeleteProgress = async (userId: string, name: string) => {
    if (!window.confirm(`Wipe ALL course progress for ${name}? This cannot be undone.`)) return
    await adminFetch('delete-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setMessage(`Progress wiped for ${name}.`)
    loadAll()
  }

  const handleDeleteAccount = async (u: AdminUser) => {
  if (!window.confirm(`Permanently delete ${u.name}'s account? This cannot be undone and removes everything — progress, leaderboard history, and the account itself.`)) return
  await adminFetch('delete-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: u.id }),
    })
  setMessage(`Account deleted for ${u.name}.`)
  loadAll()
 }

 const handleBackfill = async () => {
  setIsBackfilling(true)
  try {
    const result = await adminFetch('backfill-users', { method: 'POST' })
    setMessage(`Backfill complete — scanned ${result.scanned}, added ${result.added} new user(s).`)
    loadAll()
    } finally {
    setIsBackfilling(false)
  }
 }

  const handleToggleReviewFlag = async (u: AdminUser) => {
    await adminFetch('toggle-review-flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, hasReviewedCourse: !u.hasReviewedCourse }),
    })
    loadAll()
  }

  const handleDeleteReview = async (r: AdminReview) => {
    if (!window.confirm(`Delete ${r.userName}'s review?`)) return
    await adminFetch('delete-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r.id ? { reviewId: r.id } : { rawIndex: r.rawIndex }),
    })
    setMessage('Review deleted.')
    loadAll()
  }

  const handleDeleteLeaderboardEntry = async (id: number) => {
    await adminFetch('delete-leaderboard-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadAll()
  }

  const handleResetWeek = async (weekKey: string) => {
    if (!window.confirm(`Delete every leaderboard entry for week ${weekKey}?`)) return
    await adminFetch('reset-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekKey }),
    })
    loadAll()
  }

  const filteredUsers = users.filter(u =>
  !userSearch.trim() ||
  u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
  u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
  u.githubUsername?.toLowerCase().includes(userSearch.toLowerCase())
 )

  if (!isLoggedIn) {
    return (
      <PageWrapper bg="bg-espresso">
        <div className="px-[6vw] py-24 text-center text-white/60">Log in to continue.</div>
      </PageWrapper>
    )
  }

  if (forbidden) {
    return (
      <PageWrapper bg="bg-espresso">
        <div className="px-[6vw] py-24 text-center">
          <ShieldAlert className="w-10 h-10 text-[#FF4D6D] mx-auto mb-4" />
          <p className="font-display font-bold text-white text-xl mb-2">Not authorized</p>
          <p className="text-white/60 text-sm">This page is restricted to the site admin account.</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-[#F7B731]" />
          <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">Admin</span>
        </div>
        <h1 className="font-display font-bold text-white text-4xl mb-6">Dashboard</h1>
        <p className="text-white/40 text-sm mb-8">Signed in as @{user?.githubUsername}</p>

        {message && (
          <div className="mb-6 p-3 rounded-xl bg-[#3CCF4A]/20 text-[#3CCF4A] text-sm">{message}</div>
        )}

        {isLoading ? (
          <p className="text-white/50">Loading…</p>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
                {[
                  ['Users', stats.totalUsers],
                  ['With progress', stats.usersWithProgress],
                  ['Lesson rows', stats.totalLessonRows],
                  ['Leaderboard rows', stats.totalLeaderboardEntries],
                  ['Reviews', stats.totalReviews],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-[#4A2F2F] card-radius p-4">
                    <p className="font-display text-2xl font-bold text-white">{value}</p>
                    <p className="text-white/50 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Users */}
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-white/50" />
              <h2 className="font-display font-bold text-white text-lg">Users</h2>
            </div>
            <div className="bg-[#4A2F2F] card-radius overflow-hidden mb-10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/40 text-xs uppercase tracking-wider">
                  <tr className="text-left">
                    <th className="p-3">Name</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Reviewed?</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-white/10 text-white/80">
                      <td className="p-3">
                        {u.name}<br />
                        <span className="text-white/30 text-xs">{u.email}</span>
                      </td>
                      <td className="p-3">{u.provider === 'github' ? `@${u.githubUsername}` : 'password'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleReviewFlag(u)}
                          className={`text-xs px-2 py-1 rounded-full ${u.hasReviewedCourse ? 'bg-[#3CCF4A]/20 text-[#3CCF4A]' : 'bg-white/10 text-white/50'}`}
                        >
                          {u.hasReviewedCourse ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteProgress(u.id, u.name)}
                          className="flex items-center gap-1 text-xs text-[#FF4D6D] hover:underline ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Wipe progress
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="p-3 text-white/40 text-sm">No users yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Reviews */}
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-white/50" />
              <h2 className="font-display font-bold text-white text-lg">Reviews</h2>
            </div>
            <div className="space-y-2 mb-10">
              {reviews.map(r => (
                <div key={r.id ?? `raw-${r.rawIndex}`} className="bg-[#4A2F2F] card-radius p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {r.userName} — {r.rating}★
                      {!r.id && <span className="text-white/30 text-xs ml-2">(legacy)</span>}
                    </p>
                    <p className="text-white/60 text-sm">{r.comment}</p>
                  </div>
                  <button onClick={() => handleDeleteReview(r)} className="flex-shrink-0 text-[#FF4D6D]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-white/40 text-sm">No reviews.</p>}
            </div>

            {/* Leaderboard */}
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-white/50" />
              <h2 className="font-display font-bold text-white text-lg">Leaderboard (recent)</h2>
            </div>
            <div className="space-y-2">
              {leaderboard.map(row => (
                <div key={row.id} className="bg-[#4A2F2F] card-radius p-3 flex items-center justify-between text-sm">
                  <span className="text-white/80">{row.user_name} — {row.points} pts — {row.week_key}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleResetWeek(row.week_key)}
                      className="text-white/40 hover:text-white/70 flex items-center gap-1 text-xs"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset week
                    </button>
                    <button onClick={() => handleDeleteLeaderboardEntry(row.id)} className="text-[#FF4D6D]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-white/40 text-sm">No leaderboard rows.</p>}
            </div>
          </>
        )}
      </section>
    </PageWrapper>
  )
}
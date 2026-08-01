/**
 * AboutPage.tsx  —  /about
 *
 * Explains what DevFlow Academy is, the problem it solves, and how
 * the curriculum + practice tools + Gitter assistant fit together.
 * Also links out to /git-history for the behind-the-scenes engineering
 * story, which is deliberately kept separate from the curriculum here.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'
import { GitBranch, Heart, Compass, Sparkles, GitCommit } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const PILLARS = [
  {
    icon: Compass,
    title: 'A guided path, not a wiki dump',
    body: 'Instead of throwing every Git command at you at once, the curriculum is ordered by role — Junior Dev, DevOps, or Career Switcher — so you learn what actually matters for the work you are trying to do.',
  },
  {
    icon: Sparkles,
    title: 'Practice, not just watching',
    body: 'Commit Scenes, Repo Royale, and the Git error search tool turn real workplace situations into short, low-stakes decisions you can practice before they happen to you on a real team.',
  },
  {
    icon: Heart,
    title: 'Built to be free',
    body: 'The video lessons are curated from some of the best free Git & GitHub creators on YouTube. DevFlow Academy adds the structure, practice, and career context around them — it does not paywall the learning itself.',
  },
]

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 md:py-24 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-5 h-5 text-[#F7B731]" />
          <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">About</span>
        </div>

        <h1 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-6"
          style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          Git shouldn't be the thing<br />that scares you.
        </h1>

        <p className="text-white/75 leading-relaxed mb-6 max-w-2xl" style={{ fontSize: 'clamp(15px, 1.15vw, 19px)' }}>
          Most developers learn to write code long before they ever learn to work with a team. Then the first
          merge conflict, force-push scare, or "wait, why is main broken" moment hits — and Git suddenly feels
          like the scariest part of the job, even though it's the part that's supposed to make collaboration
          easier.
        </p>

        <p className="text-white/75 leading-relaxed mb-14 max-w-2xl" style={{ fontSize: 'clamp(15px, 1.15vw, 19px)' }}>
          DevFlow Academy exists to close that gap. It's a free, structured course that takes you from your
          first commit to confidently handling the situations that actually come up on real teams — branching,
          merge conflicts, rebasing, pull requests, and CI/CD — with practice scenarios and friendly in-app
          assistants (hi, Gitter and Gitto) along the way.
        </p>

        <div className="space-y-6 mb-14">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 bg-[#4A2F2F] card-radius card-outline p-5 md:p-6">
              <div className="w-11 h-11 rounded-full bg-[#F7B731]/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#F7B731]" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-lg mb-1.5">{title}</h2>
                <p className="text-white/65 text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Git History pointer — the "nerdy stuff" that isn't curriculum */}
        <div className="bg-[#4A2F2F] card-radius card-outline p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-white text-lg mb-1.5">Curious how this site is actually built?</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-md">
              Git History covers the behind-the-scenes engineering decisions — auth, databases, AI providers —
              that have nothing to do with the curriculum itself.
            </p>
          </div>
          <Link to="/git-history"
            className="flex-shrink-0 flex items-center gap-2 bg-rose-punch text-white font-display font-semibold px-5 py-3 rounded-xl
              hover:bg-[#ff3d5d] hover:scale-105 transition-all duration-300">
            <GitCommit className="w-4 h-4" /> View Git History
          </Link>
        </div>

        <p className="text-white/40 text-sm mt-10">
          Have a question or feedback? Visit the <a href="/support" className="text-[#F7B731] hover:underline">Support page</a>.
        </p>
      </section>
    </PageWrapper>
  )
}

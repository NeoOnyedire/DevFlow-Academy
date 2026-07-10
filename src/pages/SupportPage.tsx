/**
 * SupportPage.tsx  —  /support
 *
 * Contact / support page. Also doubles as a lightweight "about the maker"
 * page — links out to GitHub (star the projects), portfolio site, and
 * LinkedIn.
 *

 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper from '../components/PageWrapper'
import { LifeBuoy, Github, Globe, Linkedin, Star, ArrowUpRight, Mail } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

// ── Replace these with your real links ──
const SOCIAL_LINKS = {
  github: 'https://github.com/NeoOnyedire',
  portfolio: 'https://check-mate-neon-six.vercel.app/',
  linkedin: 'https://www.linkedin.com/in/neo-onyedire-107b272a9/',
}

const SUPPORT_FAQ = [
  {
    q: 'I found a bug or something looks broken.',
    a: 'Open an issue on GitHub with what you were doing and what you expected to happen — screenshots help a lot.',
  },
  {
    q: 'Can I suggest a new module or feature?',
    a: 'Yes! GitHub issues or a message on LinkedIn both work. Feature ideas from real learners shape the roadmap.',
  },
  {
    q: 'My progress disappeared.',
    a: 'Progress is stored in your browser, so a different browser, a private window, or clearing site data will show a fresh start.',
  },
]

export default function SupportPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <section className="px-[6vw] py-16 md:py-24 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <LifeBuoy className="w-5 h-5 text-[#F7B731]" />
          <span className="font-accent text-xs uppercase tracking-[0.14em] text-white/50">Support</span>
        </div>

        <h1 className="font-display font-bold text-white tracking-[0.02em] leading-none mb-4"
          style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          Need a hand?
        </h1>
        <p className="text-white/70 leading-relaxed mb-12 max-w-2xl" style={{ fontSize: 'clamp(15px, 1.15vw, 19px)' }}>
          This site is built and maintained in the open. If something's broken, you have an idea, or you just
          want to see what else I'm working on, here's where to find me.
        </p>

        {/* Social / project links */}
        <div className="grid gap-4 md:grid-cols-3 mb-14">
          <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer"
            className="group bg-[#4A2F2F] card-radius card-outline p-5 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-full bg-[#F7B731]/20 flex items-center justify-center">
                <Github className="w-5 h-5 text-[#F7B731]" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg mb-1">GitHub</p>
              <p className="text-white/55 text-sm leading-relaxed">
                See the code behind DevFlow Academy and my other projects — a star goes a long way.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-[#F7B731] text-xs font-accent uppercase tracking-wider">
              <Star className="w-3.5 h-3.5" /> Star a project
            </span>
          </a>

          <a href={SOCIAL_LINKS.portfolio} target="_blank" rel="noreferrer"
            className="group bg-[#4A2F2F] card-radius card-outline p-5 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-full bg-[#3CCF4A]/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#3CCF4A]" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg mb-1">Portfolio</p>
              <p className="text-white/55 text-sm leading-relaxed">
                More of what I've built, outside of Git tutorials.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-[#3CCF4A] text-xs font-accent uppercase tracking-wider">
              View my work
            </span>
          </a>

          <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer"
            className="group bg-[#4A2F2F] card-radius card-outline p-5 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-full bg-[#4A90D9]/20 flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-[#4A90D9]" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg mb-1">LinkedIn</p>
              <p className="text-white/55 text-sm leading-relaxed">
                Let's connect — happy to chat about the project or opportunities.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-[#4A90D9] text-xs font-accent uppercase tracking-wider">
              Connect
            </span>
          </a>
        </div>

        {/* FAQ */}
        <div className="mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-white/40" />
          <p className="font-accent text-xs uppercase tracking-[0.14em] text-white/40">Common questions</p>
        </div>
        <div className="space-y-4">
          {SUPPORT_FAQ.map(item => (
            <div key={item.q} className="bg-white/[0.05] card-radius p-5">
              <p className="font-display font-semibold text-white text-base mb-1.5">{item.q}</p>
              <p className="text-white/60 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </PageWrapper>
  )
}

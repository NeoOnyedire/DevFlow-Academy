/**
 * ChallengePage.tsx  —  /challenge
 *
 * Repo Royale — the weekly challenge leaderboard.
 * Dynamic challenge adapts to the user's role path each week.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper      from '../components/PageWrapper'
import ChallengeSection from '../sections/ChallengeSection'

gsap.registerPlugin(ScrollTrigger)

export default function ChallengePage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <ChallengeSection className="bg-espresso" />
    </PageWrapper>
  )
}

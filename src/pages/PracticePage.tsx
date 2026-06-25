/**
 * PracticePage.tsx  —  /practice
 *
 * Two interactive practice tools on one page:
 * 1. CommitScenes — "What Do You Do?" scenario cards
 * 2. ScenarioPlay — "Play the Git Floor" decision game
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper          from '../components/PageWrapper'
import CommitScenesSection  from '../sections/CommitScenesSection'
import ScenarioPlaySection  from '../sections/ScenarioPlaySection'

gsap.registerPlugin(ScrollTrigger)

export default function PracticePage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-sun-yellow">
      <CommitScenesSection className="bg-sun-yellow" />
      <ScenarioPlaySection className="bg-sun-yellow" />
    </PageWrapper>
  )
}

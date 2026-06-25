/**
 * LearnPage.tsx  —  /learn
 *
 * Full-page curriculum browser.
 * The fanned lesson cards invite exploration; clicking any card
 * opens the CurriculumPanel overlay at that specific module.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper      from '../components/PageWrapper'
import LearnGridSection from '../sections/LearnGridSection'

gsap.registerPlugin(ScrollTrigger)

export default function LearnPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-sun-yellow">
      <LearnGridSection className="bg-sun-yellow" />
    </PageWrapper>
  )
}

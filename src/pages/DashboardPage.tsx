/**
 * DashboardPage.tsx  —  /dashboard
 *
 * Full progress dashboard:
 * skill map, badges, streak, GitHub integration, career mode.
 * Guests see an aspirational preview with empty skill bars.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper      from '../components/PageWrapper'
import DashboardSection from '../sections/DashboardSection'

gsap.registerPlugin(ScrollTrigger)

export default function DashboardPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-sun-yellow">
      <DashboardSection className="bg-sun-yellow" />
    </PageWrapper>
  )
}

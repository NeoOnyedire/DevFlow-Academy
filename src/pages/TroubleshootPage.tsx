/**
 * TroubleshootPage.tsx  —  /troubleshoot
 *
 * Dedicated full-page Git error search tool.
 * Bookmarkable, shareable, accessible directly from the nav.
 * The search input auto-focuses on mount so users can type immediately.
 */
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper          from '../components/PageWrapper'
import TroubleshootSection  from '../sections/TroubleshootSection'

gsap.registerPlugin(ScrollTrigger)

export default function TroubleshootPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    // Auto-focus the search input after mount
    const input = document.getElementById('git-error-search')
    if (input) setTimeout(() => (input as HTMLInputElement).focus(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <TroubleshootSection className="bg-espresso" />
    </PageWrapper>
  )
}

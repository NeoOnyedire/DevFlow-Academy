import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PageWrapper        from '../components/PageWrapper'
import HeroSection        from '../sections/HeroSection'
import BeforeAfterSection from '../sections/BeforeAfterSection'
import ReviewsSection     from '../components/ReviewsSection'
import FooterSection      from '../sections/FooterSection'

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <PageWrapper bg="bg-espresso">
      <HeroSection        className="bg-espresso" />
      <BeforeAfterSection className="bg-espresso min-h-screen" />
      <ReviewsSection />
      <FooterSection      className="bg-sun-yellow" />
    </PageWrapper>
  )
}

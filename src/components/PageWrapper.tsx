/**
 * PageWrapper.tsx
 *
 * Shared layout shell used by every page.
 * Renders the Navigation bar and the film-grain overlay,
 * then renders children below.
 *
 * The nav is always visible at the top (no scroll-trigger hide/show
 * needed now that each page has its own focus — users aren't scrolling
 * past a full-viewport hero before they need it).
 */

import { type ReactNode } from 'react'
import Navigation from './Navigation'

interface Props {
  children: ReactNode
  /** bg-espresso | bg-sun-yellow | or any tailwind bg class */
  bg?: string
}

export default function PageWrapper({ children, bg = 'bg-espresso' }: Props) {
  return (
    <div className={`min-h-screen ${bg} relative`}>
      {/* Film grain overlay */}
      <div className="grain-overlay" />

      {/* Sticky navigation */}
      <div className="sticky top-0 z-[100]">
        <Navigation />
      </div>

      {/* Page content */}
      <main className="relative overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}

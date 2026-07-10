import { type ReactNode } from 'react'
import Navigation from './Navigation'

interface Props {
  children: ReactNode
  bg?: string
}

export default function PageWrapper({ children, bg = 'bg-espresso' }: Props) {
  return (
    <div className={`min-h-screen ${bg} relative overflow-x-hidden`}>
      <div className="grain-overlay" />
      <div className="sticky top-0 z-[100]">
        <Navigation />
      </div>
      <main>
        {children}
      </main>
    </div>
  )
}

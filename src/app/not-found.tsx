import Link from 'next/link'
import { Home, Search } from 'lucide-react'

import { BrandMark, ButtonLink, SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <SurfaceCard className="w-full max-w-2xl p-8 text-center">
        <BrandMark />
        <div className="mt-6">
          <SectionEyebrow>Page not found</SectionEyebrow>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--text-strong)]">We could not find that page</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            The route may have changed, or the page may not exist yet. Use the home page or the dashboard to continue.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" icon="none">
            Home
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary" icon="none">
            Dashboard
          </ButtonLink>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
          <Search className="h-3.5 w-3.5" />
          Try the homepage or dashboard
        </div>
      </SurfaceCard>
    </div>
  )
}

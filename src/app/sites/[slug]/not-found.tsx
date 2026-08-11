import { Home, Search } from 'lucide-react'

import { ButtonLink, SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <SurfaceCard className="w-full max-w-xl p-8 text-center">
        <SectionEyebrow>Site not found</SectionEyebrow>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--text-strong)]">This clinic site does not exist yet</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          The slug may not be published yet. Return to the dashboard to create or publish the site.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/dashboard/website" icon="none">
            Open website builder
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" icon="none">
            Home
          </ButtonLink>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
          <Search className="h-3.5 w-3.5" />
          Published clinic sites load from the `sites/[slug]` route
        </div>
      </SurfaceCard>
    </div>
  )
}

import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BrandMark, SurfaceCard } from '@/components/dashboard/shared'

export function LegalPageLayout({
  title,
  effectiveDate,
  children,
}: {
  title: string
  effectiveDate: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.1),transparent_28%),linear-gradient(180deg,rgba(243,249,249,1),rgba(247,252,252,1))] px-4 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <BrandMark />
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)]">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </a>
        </div>

        <SurfaceCard className="mt-8 p-8 lg:p-10">
          <h1 className="font-display text-3xl font-black tracking-tight text-[var(--text-strong)]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Effective date: {effectiveDate}</p>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <strong>Template notice:</strong> this document is a starting point, not legal advice. Replace the
            bracketed placeholders and have a lawyer review it against your actual business, entity, and
            jurisdiction before relying on it.
          </div>

          <div className="prose-legal mt-8 space-y-6 text-sm leading-7 text-[var(--text-strong)]">{children}</div>
        </SurfaceCard>
      </div>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-[var(--text-strong)]">{title}</h2>
      <div className="mt-2 space-y-3 text-[var(--text-muted)]">{children}</div>
    </section>
  )
}

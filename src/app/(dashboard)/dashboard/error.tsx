"use client"

import { AlertTriangle, RefreshCw } from 'lucide-react'

import { ButtonLink, SurfaceCard, SectionEyebrow } from '@/components/dashboard/shared'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const DashboardError = ({ error, reset }: ErrorProps) => {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <SurfaceCard className="w-full max-w-xl p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="mt-5">
          <SectionEyebrow>Dashboard error</SectionEyebrow>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-strong)]">Something went wrong</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            The dashboard could not finish loading. Try again or return to the main dashboard.
          </p>
          <p className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-left text-sm text-[var(--text-muted)]">
            {error.message}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(15,118,110,0.22)] transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <ButtonLink href="/dashboard" variant="secondary" icon="none">
            Back to dashboard
          </ButtonLink>
        </div>
      </SurfaceCard>
    </div>
  )
}

export default DashboardError

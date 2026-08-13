import { BrandMark } from '@/components/dashboard/shared'

export default function DashboardGroupLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_12%_18%,rgba(15, 42, 107,0.12),transparent_22%),radial-gradient(circle_at_86%_10%,rgba(236,170,93,0.14),transparent_18%),var(--page-bg)] px-4">
      <div className="flex flex-col items-center gap-4">
        <BrandMark />
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full" style={{ background: 'var(--brand)' }} />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Loading your dashboard
          </span>
        </div>
      </div>
    </div>
  )
}

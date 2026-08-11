import { Suspense } from 'react'
import { BrandMark, SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'
import { PortalRegisterForm } from '@/components/portal/PortalRegisterForm'

export default function Page() {
  return (
    <div className="grid min-h-[calc(100vh-0px)] gap-8 px-4 py-6 lg:grid-cols-[1fr_0.94fr] lg:px-8">
      <SurfaceCard className="p-8">
        <Suspense
          fallback={
            <div className="max-w-md space-y-4">
              <SectionEyebrow>Client onboarding</SectionEyebrow>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-strong)]">Create your portal profile</h2>
              <p className="text-sm leading-7 text-[var(--text-muted)]">Loading the registration form...</p>
            </div>
          }
        >
          <PortalRegisterForm />
        </Suspense>
      </SurfaceCard>
      <SurfaceCard className="relative overflow-hidden bg-slate-950 p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.22),transparent_34%)]" />
        <div className="relative">
          <BrandMark />
          <h1 className="mt-10 text-4xl font-black tracking-tight sm:text-5xl">Everything the business needs, from a client account</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/76">
            View your appointments, receive reminders, and open support tickets without calling the front desk.
          </p>
        </div>
      </SurfaceCard>
    </div>
  )
}

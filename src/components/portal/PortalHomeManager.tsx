import { CalendarDays, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react'
import type { AppointmentWithRelations, Client } from '@/types'
import { SectionEyebrow, SurfaceCard, StatusBadge, ButtonLink, ValueCard } from '@/components/dashboard/shared'
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  formatDateTimeInTimeZone,
} from '@/components/dashboard/appointments-utils'

export function PortalHomeManager({
  client,
  businessName,
  timezone,
  appointments,
}: {
  client: Client
  businessName: string
  timezone: string
  appointments: AppointmentWithRelations[]
}) {
  // eslint-disable-next-line react-hooks/purity -- Server Component, renders once per request; not subject to client re-render instability
  const now = Date.now()
  const upcoming = appointments
    .filter((appt) => appt.status !== 'cancelled' && appt.status !== 'completed' && new Date(appt.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  const nextAppointment = upcoming[0] ?? null
  const paidCount = appointments.filter((appt) => appt.paymentStatus === 'paid' || appt.paymentStatus === 'cash').length
  const completedCount = appointments.filter((appt) => appt.status === 'completed').length
  const recent = [...appointments].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).slice(0, 5)

  return (
    <div className="space-y-8">
      <SurfaceCard className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionEyebrow>Client portal</SectionEyebrow>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-strong)]">Welcome back, {client.name}</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Manage your {businessName} appointments, payments, and support requests.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/portal/appointments" icon="calendar">
              View appointments
            </ButtonLink>
            <ButtonLink href="/portal/support" variant="secondary" icon="none">
              Open support
            </ButtonLink>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ValueCard label="Upcoming" value={String(upcoming.length)} icon={CalendarDays} tone="teal" />
        <ValueCard label="Completed" value={String(completedCount)} icon={CheckCircle2} tone="emerald" />
        <ValueCard label="Paid" value={String(paidCount)} icon={Wallet} tone="blue" />
        <ValueCard label="Portal status" value="Active" icon={ShieldCheck} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <SurfaceCard className="p-6">
          {nextAppointment ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Upcoming appointment</div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)]">
                    {nextAppointment.service?.name ?? 'Appointment'}
                  </h2>
                </div>
                <StatusBadge tone={APPOINTMENT_STATUS_TONE[nextAppointment.status]}>
                  {APPOINTMENT_STATUS_LABEL[nextAppointment.status]}
                </StatusBadge>
              </div>
              <div className="mt-5 space-y-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--panel-soft)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[var(--text-muted)]">When</span>
                  <strong className="text-sm text-[var(--text-strong)]">
                    {formatDateTimeInTimeZone(nextAppointment.scheduledAt, timezone)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[var(--text-muted)]">Business</span>
                  <strong className="text-sm text-[var(--text-strong)]">{businessName}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">
              No upcoming appointments right now.
            </div>
          )}
        </SurfaceCard>
        <SurfaceCard className="p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Recent activity</div>
          <div className="mt-5 space-y-3">
            {recent.length === 0 ? (
              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                No appointments on file yet.
              </div>
            ) : (
              recent.map((appointment) => (
                <div key={appointment.id} className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-[var(--text-strong)]">{appointment.service?.name ?? 'Appointment'}</div>
                      <div className="text-xs text-[var(--text-muted)]">{formatDateTimeInTimeZone(appointment.scheduledAt, timezone)}</div>
                    </div>
                    <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                      {APPOINTMENT_STATUS_LABEL[appointment.status]}
                    </StatusBadge>
                  </div>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

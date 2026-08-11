'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { AppointmentStatus, AppointmentWithRelations } from '@/types'
import { SurfaceCard, StatusBadge } from '@/components/dashboard/shared'
import { cn } from '@/lib/utils'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Booked',
  pending_confirmation: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
}

const STATUS_TONE: Record<AppointmentStatus, 'blue' | 'amber' | 'emerald' | 'rose' | 'teal'> = {
  scheduled: 'blue',
  pending_confirmation: 'amber',
  confirmed: 'emerald',
  completed: 'teal',
  cancelled: 'rose',
  no_show: 'amber',
}

function zonedParts(iso: string, timezone: string) {
  const date = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date)
  const weekdayAbbr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24
  const dayIndex = DAY_LABELS.findIndex((d) => weekdayAbbr.startsWith(d))
  return { dayIndex: dayIndex === -1 ? 0 : dayIndex, hour }
}

function formatTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function formatDate(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export function CalendarManager({
  weekAppointments,
  weekLabel,
  timezone,
}: {
  weekAppointments: AppointmentWithRelations[]
  weekLabel: string
  timezone: string
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState(weekAppointments)
  const [busy, setBusy] = useState(false)

  const placed = useMemo(() => {
    const inGrid: Array<AppointmentWithRelations & { dayIndex: number; hour: number }> = []
    const outsideGrid: AppointmentWithRelations[] = []
    for (const appt of appointments) {
      const { dayIndex, hour } = zonedParts(appt.scheduledAt, timezone)
      if (hour >= HOURS[0] && hour <= HOURS[HOURS.length - 1]) {
        inGrid.push({ ...appt, dayIndex, hour })
      } else {
        outsideGrid.push(appt)
      }
    }
    return { inGrid, outsideGrid }
  }, [appointments, timezone])

  const selected = appointments.find((a) => a.id === selectedId) ?? null

  async function changeStatus(appointmentId: string, status: AppointmentStatus) {
    setBusy(true)
    const res = await fetch('/api/appointments/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, status }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, ...data.appointment } : a)))
    }
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Week view</div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">{weekLabel}</h2>
          </div>
          <div className="flex items-center border border-[var(--border-soft)]">
            {['Week', 'Month', 'Day'].map((label, index) => (
              <button
                key={label}
                type="button"
                disabled={index !== 0}
                title={index !== 0 ? 'Coming soon — use week view to see and confirm appointments' : undefined}
                className={cn(
                  'px-4 py-2 text-sm font-semibold',
                  index === 0 ? 'text-white' : 'cursor-not-allowed bg-[var(--panel)] text-[var(--text-muted)]/50',
                )}
                style={index === 0 ? { background: 'var(--brand)' } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto border border-[var(--border-soft)]">
          <div className="grid min-w-[820px] grid-cols-[56px_repeat(7,1fr)]">
            <div className="border-b border-[var(--border-soft)]" />
            {DAY_LABELS.map((day) => (
              <div key={day} className="border-b border-l border-[var(--border-soft)] py-2.5 text-center font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {day}
              </div>
            ))}
            {HOURS.map((hour) => (
              <div key={`row-${hour}`} className="contents">
                <div className="border-b border-[var(--border-soft)] px-2 py-1.5 text-[11px] text-[var(--text-muted)]">
                  {hour % 12 === 0 ? 12 : hour % 12}{hour < 12 ? 'am' : 'pm'}
                </div>
                {DAY_LABELS.map((_, dayIndex) => {
                  const cellAppts = placed.inGrid.filter((a) => a.dayIndex === dayIndex && a.hour === hour)
                  return (
                    <div key={`${hour}-${dayIndex}`} className="h-14 border-b border-l border-[var(--border-soft)] p-0.5">
                      {cellAppts.map((appt) => (
                        <button
                          key={appt.id}
                          type="button"
                          onClick={() => setSelectedId(appt.id)}
                          className="block w-full truncate border px-1.5 py-1 text-left text-[11px] font-semibold"
                          style={{ borderColor: 'var(--brand)', background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}
                        >
                          {formatTime(appt.scheduledAt, timezone)} · {appt.client?.name ?? 'Unknown'}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {placed.outsideGrid.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Outside 8am–6pm</div>
            {placed.outsideGrid.map((appt) => (
              <button
                key={appt.id}
                type="button"
                onClick={() => setSelectedId(appt.id)}
                className="flex w-full items-center justify-between gap-3 border border-[var(--border-soft)] px-4 py-2.5 text-left text-sm"
              >
                <span className="font-semibold text-[var(--text-strong)]">{appt.client?.name ?? 'Unknown'} · {appt.service?.name ?? ''}</span>
                <span className="text-[var(--text-muted)]">{formatDate(appt.scheduledAt, timezone)}, {formatTime(appt.scheduledAt, timezone)}</span>
              </button>
            ))}
          </div>
        )}

        {appointments.length === 0 && (
          <p className="mt-4 text-sm text-[var(--text-muted)]">No appointments scheduled this week.</p>
        )}
      </SurfaceCard>

      {selected && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" onClick={() => setSelectedId(null)}>
          <div
            className="w-full max-w-md border border-[var(--border-soft)] bg-[var(--panel)] shadow-[3px_3px_0_0_var(--border-soft)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 text-white" style={{ background: 'var(--surface-dark)' }}>
              <div>
                <div className="font-display text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--brand-soft)' }}>
                  Appointment
                </div>
                <div className="mt-0.5 font-display text-lg font-bold">
                  {formatDate(selected.scheduledAt, timezone)}, {formatTime(selected.scheduledAt, timezone)}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between text-sm"><span className="text-[var(--text-muted)]">Client</span><strong className="text-[var(--text-strong)]">{selected.client?.name ?? 'Unknown'}</strong></div>
              <div className="flex items-center justify-between text-sm"><span className="text-[var(--text-muted)]">Service</span><strong className="text-[var(--text-strong)]">{selected.service?.name ?? '—'}</strong></div>
              <div className="flex items-center justify-between text-sm"><span className="text-[var(--text-muted)]">Status</span><StatusBadge tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</StatusBadge></div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" disabled={busy} onClick={() => void changeStatus(selected.id, 'confirmed')} className="btn-primary justify-center !py-2.5 !text-xs">Confirm</button>
                <button type="button" disabled={busy} onClick={() => void changeStatus(selected.id, 'completed')} className="btn-secondary justify-center !py-2.5 !text-xs">Completed</button>
                <button type="button" disabled={busy} onClick={() => void changeStatus(selected.id, 'no_show')} className="btn-secondary justify-center !py-2.5 !text-xs">No show</button>
                <button type="button" disabled={busy} onClick={() => void changeStatus(selected.id, 'cancelled')} className="btn-secondary justify-center !py-2.5 !text-xs !text-[var(--coral)]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

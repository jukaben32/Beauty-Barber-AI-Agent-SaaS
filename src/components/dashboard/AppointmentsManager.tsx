'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import type { AppointmentStatus, AppointmentWithRelations } from '@/types'
import { SurfaceCard, StatusBadge, Pill } from '@/components/dashboard/shared'
import { cn, formatCurrency } from '@/lib/utils'
import { AppointmentDetailsDrawer } from './AppointmentDetailsDrawer'
import {
  APPOINTMENT_SOURCE_LABEL,
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from './appointments-utils'

const STATUS_FILTERS: Array<{ label: string; value: AppointmentStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Booked', value: 'scheduled' },
  { label: 'Pending', value: 'pending_confirmation' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No show', value: 'no_show' },
]

function buildSearchIndex(appointment: AppointmentWithRelations) {
  return [
    appointment.client?.name,
    appointment.client?.phone,
    appointment.client?.email,
    appointment.client?.dateOfBirth,
    appointment.service?.name,
    appointment.notes,
    appointment.source,
    appointment.status,
    appointment.paymentStatus,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function formatShortDateTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatShortTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function AppointmentsManager({
  initialAppointments,
  timezone,
  businessName,
}: {
  initialAppointments: AppointmentWithRelations[]
  timezone: string
  businessName?: string
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(initialAppointments[0]?.id ?? null)
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialAppointments[0]))

  const summary = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        acc.total += 1
        acc.status[appointment.status] += 1
        if (appointment.paymentStatus === 'pending' || appointment.paymentStatus === 'partial') {
          acc.needsPayment += 1
        }
        return acc
      },
      {
        total: 0,
        needsPayment: 0,
        status: {
          scheduled: 0,
          pending_confirmation: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
        } as Record<AppointmentStatus, number>,
      }
    )
  }, [appointments])

  const visibleAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return appointments.filter((appointment) => {
      const matchesFilter = filter === 'all' ? true : appointment.status === filter
      const matchesQuery = normalizedQuery ? buildSearchIndex(appointment).includes(normalizedQuery) : true
      return matchesFilter && matchesQuery
    })
  }, [appointments, filter, query])

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedId) ?? null

  useEffect(() => {
    if (!drawerOpen) return

    if (visibleAppointments.length === 0) {
      setDrawerOpen(false)
      return
    }

    if (!selectedId || !visibleAppointments.some((appointment) => appointment.id === selectedId)) {
      setSelectedId(visibleAppointments[0].id)
    }
  }, [drawerOpen, selectedId, visibleAppointments])

  function handleAppointmentUpdated(updated: AppointmentWithRelations) {
    setAppointments((current) => current.map((appointment) => (appointment.id === updated.id ? { ...appointment, ...updated } : appointment)))
    setSelectedId(updated.id)
  }

  function openAppointment(appointmentId: string) {
    setSelectedId(appointmentId)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Appointments
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text-strong)]">
                Manage bookings, call outcomes, and business payments
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                Review client bookings in real time, inspect the appointment drawer, and keep cash or partial payments in sync with the schedule.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="teal">{summary.total} total</Pill>
                <Pill tone="blue">{summary.status.scheduled} booked</Pill>
                <Pill tone="amber">{summary.needsPayment} payment due</Pill>
                <Pill tone="slate">{summary.status.cancelled} cancelled</Pill>
              </div>
            </div>

            {businessName ? (
              <div className="hidden rounded-[24px] border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-right backdrop-blur-sm lg:block">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Business</div>
                <div className="mt-1 font-display text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{businessName}</div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, phone, email or service..."
                className="input-field w-full pl-11"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as AppointmentStatus | 'all')}
              className="input-field w-full"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div
              className="grid gap-3 border-b border-[var(--border-soft)] bg-[rgba(16,33,41,0.04)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]"
              style={{
                gridTemplateColumns: 'minmax(220px, 1.3fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(150px, 0.9fr) minmax(130px, 0.85fr) 56px',
              }}
            >
              <div>Client</div>
              <div>Date of Birth</div>
              <div>Service</div>
              <div>Scheduled</div>
              <div>Payment</div>
              <div>Status</div>
              <div className="text-center">Actions</div>
            </div>

            <div className="divide-y divide-[var(--border-soft)]">
              {visibleAppointments.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                  No appointments match the current search or status filter.
                </div>
              ) : (
                visibleAppointments.map((appointment) => {
                  const isSelected = selectedId === appointment.id && drawerOpen
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => openAppointment(appointment.id)}
                      className={cn(
                        'grid w-full gap-3 px-6 py-4 text-left text-sm transition',
                        isSelected ? 'bg-[var(--brand-soft)]/60' : 'hover:bg-[rgba(16,33,41,0.03)]'
                      )}
                      style={{
                        gridTemplateColumns: 'minmax(220px, 1.3fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(150px, 0.9fr) minmax(130px, 0.85fr) 56px',
                      }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[var(--text-strong)]">
                          {appointment.client?.name ?? 'Unknown client'}
                        </div>
                        <div className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {appointment.client?.phone ?? appointment.client?.email ?? 'No contact on file'}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[var(--text-strong)]">
                          {appointment.client?.dateOfBirth ?? 'N/A'}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[var(--text-strong)]">
                          {appointment.service?.name ?? 'General Consultation'}
                        </div>
                        <div className="mt-1 truncate text-xs text-[var(--text-muted)]">
                          {APPOINTMENT_SOURCE_LABEL[appointment.source]}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-strong)]">
                          {formatShortDateTime(appointment.scheduledAt, timezone)}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {formatShortTime(appointment.scheduledAt, timezone)}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <StatusBadge tone={PAYMENT_STATUS_TONE[appointment.paymentStatus]}>{PAYMENT_STATUS_LABEL[appointment.paymentStatus]}</StatusBadge>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {appointment.paymentAmount != null
                            ? formatCurrency(appointment.paymentAmount, appointment.paymentCurrency)
                            : 'Amount not set'}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                          {APPOINTMENT_STATUS_LABEL[appointment.status]}
                        </StatusBadge>
                      </div>

                      <div className="grid place-items-center text-[var(--text-muted)]">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </SurfaceCard>

      <AppointmentDetailsDrawer
        appointment={drawerOpen ? selectedAppointment : null}
        timezone={timezone}
        onClose={() => setDrawerOpen(false)}
        onAppointmentUpdated={handleAppointmentUpdated}
      />
    </div>
  )
}

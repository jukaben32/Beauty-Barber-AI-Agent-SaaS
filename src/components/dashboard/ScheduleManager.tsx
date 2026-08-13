'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Wallet,
} from 'lucide-react'
import type { AppointmentWithRelations } from '@/types'
import type { LucideIcon } from 'lucide-react'
import { SurfaceCard, StatusBadge, Pill } from '@/components/dashboard/shared'
import { cn } from '@/lib/utils'
import { AppointmentDetailsDrawer } from './AppointmentDetailsDrawer'
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  formatTimeInTimeZone,
} from './appointments-utils'
import { getDateKeyInTimeZone, zonedTimeToUtc } from '@/services/_shared'

type IndexedAppointment = AppointmentWithRelations & {
  dateKey: string
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return { year, month, day }
}

function formatDateKey(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function dateKeyToZonedInstant(dateKey: string, timezone: string) {
  return zonedTimeToUtc(dateKey, '12:00:00', timezone)
}

function startOfMonthKey(dateKey: string) {
  const { year, month } = parseDateKey(dateKey)
  return formatDateKey(year, month, 1)
}

function addDaysToDateKey(dateKey: string, days: number) {
  const { year, month, day } = parseDateKey(dateKey)
  const cursor = new Date(Date.UTC(year, month - 1, day))
  cursor.setUTCDate(cursor.getUTCDate() + days)
  return formatDateKey(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate())
}

function shiftMonthKey(dateKey: string, deltaMonths: number) {
  const { year, month, day } = parseDateKey(dateKey)
  const cursor = new Date(Date.UTC(year, month - 1 + deltaMonths, 1))
  const targetYear = cursor.getUTCFullYear()
  const targetMonth = cursor.getUTCMonth() + 1
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
  return formatDateKey(targetYear, targetMonth, Math.min(day, daysInTargetMonth))
}

function formatMonthLabel(dateKey: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'long',
    year: 'numeric',
  }).format(dateKeyToZonedInstant(dateKey, timezone))
}

function formatSelectedDateLabel(dateKey: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateKeyToZonedInstant(dateKey, timezone))
}

function formatCalendarCellDate(dateKey: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    day: 'numeric',
  }).formatToParts(dateKeyToZonedInstant(dateKey, timezone))

  return parts.find((part) => part.type === 'day')?.value ?? ''
}

function formatMonthShort(dateKey: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
  }).format(dateKeyToZonedInstant(dateKey, timezone))
}

function isPaymentUnpaid(status: AppointmentWithRelations['paymentStatus']) {
  return status === 'pending' || status === 'partial'
}

function shiftMonthBy(dateKey: string, deltaMonths: number) {
  return shiftMonthKey(dateKey, deltaMonths)
}

function ScheduleMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone: 'teal' | 'amber' | 'rose' | 'blue'
}) {
  const accentClasses: Record<'teal' | 'amber' | 'rose' | 'blue', string> = {
    teal: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
    amber: 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-strong)]',
    rose: 'border-[var(--coral)] bg-[var(--coral-soft)] text-[var(--coral)]',
    blue: 'border-[var(--border-strong)] bg-white text-[var(--brand-strong)]',
  }

  const accentBar: Record<'teal' | 'amber' | 'rose' | 'blue', string> = {
    teal: 'linear-gradient(90deg,var(--brand),rgba(91, 15, 33,0.2))',
    amber: 'linear-gradient(90deg,var(--border-strong),rgba(201,159,108,0.2))',
    rose: 'linear-gradient(90deg,var(--coral),rgba(208,78,64,0.2))',
    blue: 'linear-gradient(90deg,var(--brand-strong),rgba(91, 15, 33,0.14))',
  }

  return (
    <SurfaceCard className="relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accentBar[tone] }} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{value}</div>
          <div className="mt-1 text-xs font-medium text-[var(--text-muted)]">{helper}</div>
        </div>
        <div className={cn('grid h-11 w-11 place-items-center rounded-[16px] border', accentClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </SurfaceCard>
  )
}

function AppointmentRow({
  appointment,
  timezone,
  onClick,
}: {
  appointment: IndexedAppointment
  timezone: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[22px] border border-[var(--border-soft)] bg-white/82 px-4 py-3 text-left transition hover:border-[var(--border-strong)] hover:bg-white"
    >
      <div className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] md:items-center">
        <div>
          <div className="font-display text-[15px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
            {formatTimeInTimeZone(appointment.scheduledAt, timezone)}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {appointment.service?.name ?? 'General Consultation'}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate font-semibold text-[var(--text-strong)]">
              {appointment.client?.name ?? 'Unknown client'}
            </div>
            <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
              {APPOINTMENT_STATUS_LABEL[appointment.status]}
            </StatusBadge>
            <StatusBadge tone={PAYMENT_STATUS_TONE[appointment.paymentStatus]}>
              {PAYMENT_STATUS_LABEL[appointment.paymentStatus]}
            </StatusBadge>
          </div>

          <div className="mt-1 truncate text-sm text-[var(--text-muted)]">
            {appointment.client?.phone ?? appointment.client?.email ?? 'No contact on file'}
          </div>
        </div>
      </div>
    </button>
  )
}

function CalendarCell({
  dateKey,
  timezone,
  appointmentCount,
  isSelected,
  isToday,
  onClick,
}: {
  dateKey: string | null
  timezone: string
  appointmentCount: number
  isSelected: boolean
  isToday: boolean
  onClick: (dateKey: string) => void
}) {
  if (!dateKey) {
    return <div className="min-h-[96px] rounded-[20px] border border-transparent" />
  }

  const hasAppointments = appointmentCount > 0

  return (
    <button
      type="button"
      onClick={() => onClick(dateKey)}
      className={cn(
        'group flex min-h-[96px] flex-col justify-between rounded-[20px] border p-3 text-left transition',
        isSelected
          ? 'border-[var(--brand)] bg-[var(--brand-soft)]/80 shadow-[2px_2px_0_0_var(--brand)]'
          : 'border-[var(--border-soft)] bg-white/78 hover:border-[var(--border-strong)] hover:bg-white',
        isToday && !isSelected && 'ring-1 ring-[var(--brand)]/35',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn('font-display text-lg font-semibold tracking-[-0.03em]', isSelected ? 'text-[var(--brand-strong)]' : 'text-[var(--text-strong)]')}>
          {formatCalendarCellDate(dateKey, timezone)}
        </div>
        {hasAppointments ? (
          <span className="rounded-full border border-[var(--brand)] bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-strong)]">
            {appointmentCount}
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {isToday ? 'Today' : ''}
        </div>
        <div className={cn('h-2 w-2 rounded-full', hasAppointments ? 'bg-[var(--brand)]' : 'bg-transparent')} />
      </div>
    </button>
  )
}

function SelectedDayHeader({
  title,
  count,
  onPrevDay,
  onNextDay,
}: {
  title: string
  count: number
  onPrevDay: () => void
  onNextDay: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Today&apos;s Schedule
        </div>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{count} appointment{count === 1 ? '' : 's'}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevDay}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-soft)] bg-white/80 text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNextDay}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-soft)] bg-white/80 text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white"
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ScheduleManager({
  initialAppointments,
  timezone,
  businessName,
  initialSelectedDateKey,
  todayKey,
}: {
  initialAppointments: AppointmentWithRelations[]
  timezone: string
  businessName?: string
  initialSelectedDateKey: string
  todayKey: string
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [selectedDateKey, setSelectedDateKey] = useState(initialSelectedDateKey)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  const indexedAppointments = useMemo<IndexedAppointment[]>(
    () =>
      appointments.map((appointment) => ({
        ...appointment,
        dateKey: getDateKeyInTimeZone(new Date(appointment.scheduledAt), timezone),
      })),
    [appointments, timezone],
  )

  const appointmentCountsByDate = useMemo(() => {
    return indexedAppointments.reduce<Record<string, number>>((acc, appointment) => {
      acc[appointment.dateKey] = (acc[appointment.dateKey] ?? 0) + 1
      return acc
    }, {})
  }, [indexedAppointments])

  const monthMeta = useMemo(() => {
    const monthStartKey = startOfMonthKey(selectedDateKey)
    const { year, month } = parseDateKey(monthStartKey)
    const monthDays = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const leadingBlanks = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
    const cells: Array<string | null> = []

    for (let index = 0; index < 42; index += 1) {
      const dayNumber = index - leadingBlanks + 1
      if (dayNumber < 1 || dayNumber > monthDays) {
        cells.push(null)
        continue
      }
      cells.push(formatDateKey(year, month, dayNumber))
    }

    return {
      monthStartKey,
      monthLabel: formatMonthLabel(monthStartKey, timezone),
      cells,
    }
  }, [selectedDateKey, timezone])

  const selectedDayAppointments = useMemo(
    () =>
      indexedAppointments
        .filter((appointment) => appointment.dateKey === selectedDateKey)
        .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()),
    [indexedAppointments, selectedDateKey],
  )

  const selectedDaySummary = useMemo(() => {
    return selectedDayAppointments.reduce(
      (acc, appointment) => {
        acc.total += 1
        if (appointment.status === 'confirmed') acc.confirmed += 1
        if (appointment.status === 'pending_confirmation') acc.pending += 1
        if (isPaymentUnpaid(appointment.paymentStatus)) acc.unpaid += 1
        return acc
      },
      {
        total: 0,
        confirmed: 0,
        pending: 0,
        unpaid: 0,
      },
    )
  }, [selectedDayAppointments])

  const upcomingAppointments = useMemo(() => {
    return indexedAppointments
      .filter((appointment) => appointment.dateKey > selectedDateKey && appointment.dateKey <= addDaysToDateKey(selectedDateKey, 30))
      .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())
  }, [indexedAppointments, selectedDateKey])

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null
  const selectedDateLabel = formatSelectedDateLabel(selectedDateKey, timezone)
  const selectedMonthLabel = formatMonthLabel(selectedDateKey, timezone)
  const selectedDayIsToday = selectedDateKey === todayKey

  function openAppointment(appointmentId: string) {
    setSelectedAppointmentId(appointmentId)
  }

  function handleAppointmentUpdated(updated: AppointmentWithRelations) {
    setAppointments((current) => current.map((appointment) => (appointment.id === updated.id ? { ...appointment, ...updated } : appointment)))
    setSelectedAppointmentId(updated.id)
  }

  function moveDay(deltaDays: number) {
    setSelectedDateKey((current) => addDaysToDateKey(current, deltaDays))
  }

  function moveMonth(deltaMonths: number) {
    setSelectedDateKey((current) => shiftMonthBy(current, deltaMonths))
  }

  function jumpToToday() {
    setSelectedDateKey(todayKey)
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
                Manage client bookings &amp; schedule
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                Browse the monthly calendar, review today&apos;s visits, and open the detail drawer to confirm, complete, refund, or record payments in real time.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="teal">{selectedDaySummary.total} total</Pill>
                <Pill tone="blue">{selectedDaySummary.confirmed} confirmed</Pill>
                <Pill tone="amber">{selectedDaySummary.pending} pending</Pill>
                <Pill tone="rose">{selectedDaySummary.unpaid} unpaid today</Pill>
              </div>
            </div>

            <div className="hidden rounded-[24px] border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-right backdrop-blur-sm lg:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Business</div>
              <div className="mt-1 font-display text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                {businessName ?? 'Business'}
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{selectedDateLabel}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ScheduleMetricCard
              label="Today's Total"
              value={String(selectedDaySummary.total)}
              helper={selectedDayIsToday ? 'Selected day is today' : selectedDateLabel}
              icon={CalendarDays}
              tone="teal"
            />
            <ScheduleMetricCard
              label="Confirmed"
              value={String(selectedDaySummary.confirmed)}
              helper="Appointments ready to see"
              icon={CheckCircle2}
              tone="blue"
            />
            <ScheduleMetricCard
              label="Pending"
              value={String(selectedDaySummary.pending)}
              helper="Awaiting confirmation"
              icon={Clock3}
              tone="amber"
            />
            <ScheduleMetricCard
              label="Unpaid Today"
              value={String(selectedDaySummary.unpaid)}
              helper="Pending or partial payments"
              icon={Wallet}
              tone="rose"
            />
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(245,238,230,0.9))] px-6 py-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-[var(--border-soft)] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      Calendar
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                      {selectedMonthLabel}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Select a day to inspect appointments and payment status.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveMonth(-1)}
                      className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-soft)] bg-white/80 text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={jumpToToday}
                      className="rounded-full border border-[var(--border-soft)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMonth(1)}
                      className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-soft)] bg-white/80 text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="py-1">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {monthMeta.cells.map((dateKey, index) => {
                    const cellDateKey = dateKey
                    const appointmentCount = cellDateKey ? (appointmentCountsByDate[cellDateKey] ?? 0) : 0
                    const isSelected = cellDateKey === selectedDateKey
                    const isToday = cellDateKey === todayKey

                    return (
                      <CalendarCell
                        key={`${monthMeta.monthStartKey}-${index}`}
                        dateKey={cellDateKey}
                        timezone={timezone}
                        appointmentCount={appointmentCount}
                        isSelected={isSelected}
                        isToday={isToday}
                        onClick={setSelectedDateKey}
                      />
                    )
                  })}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--border-soft)] bg-white/78 px-4 py-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Selected day
                    </div>
                    <div className="mt-1 font-display text-base font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                      {selectedDateLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
                    {selectedDayAppointments.length} appointment{selectedDayAppointments.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-[var(--border-soft)] px-5 py-4">
                <SelectedDayHeader
                  title={selectedDayIsToday ? 'Today' : selectedDateLabel}
                  count={selectedDayAppointments.length}
                  onPrevDay={() => moveDay(-1)}
                  onNextDay={() => moveDay(1)}
                />
              </div>

              <div className="space-y-3 px-5 py-5">
                {selectedDayAppointments.length === 0 ? (
                  <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/80 px-5 py-10 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[var(--border-soft)] bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                      No appointments on this day
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                      Move the calendar or jump back to today to inspect a different day.
                    </p>
                    <button
                      type="button"
                      onClick={jumpToToday}
                      className="mt-4 rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-strong)] transition hover:border-[var(--border-strong)]"
                    >
                      Go to today
                    </button>
                  </div>
                ) : (
                  selectedDayAppointments.map((appointment) => (
                    <AppointmentRow
                      key={appointment.id}
                      appointment={appointment}
                      timezone={timezone}
                      onClick={() => openAppointment(appointment.id)}
                    />
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard className="mt-6 overflow-hidden">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    Upcoming
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                    Next 30 Days
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Future appointments sorted by date and time.
                  </p>
                </div>

                <Pill tone="slate">{upcomingAppointments.length} upcoming</Pill>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-soft)]">
              {upcomingAppointments.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">
                  No upcoming appointments in the next 30 days.
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => openAppointment(appointment.id)}
                    className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-[rgba(16,33,41,0.03)] md:grid-cols-[96px_minmax(0,1fr)] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[18px] border border-[var(--border-soft)] bg-[var(--brand-soft)] text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                          {formatMonthShort(appointment.dateKey, timezone)}
                        </div>
                        <div className="font-display text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                          {formatCalendarCellDate(appointment.dateKey, timezone)}
                        </div>
                      </div>

                      <div className="md:hidden">
                        <div className="font-display text-[15px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                          {formatTimeInTimeZone(appointment.scheduledAt, timezone)}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {appointment.service?.name ?? 'General Consultation'}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate font-semibold text-[var(--text-strong)]">
                          {appointment.client?.name ?? 'Unknown client'}
                        </div>
                        <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                          {APPOINTMENT_STATUS_LABEL[appointment.status]}
                        </StatusBadge>
                        <StatusBadge tone={PAYMENT_STATUS_TONE[appointment.paymentStatus]}>
                          {PAYMENT_STATUS_LABEL[appointment.paymentStatus]}
                        </StatusBadge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Clock3 className="h-4 w-4" />
                        <span>{formatTimeInTimeZone(appointment.scheduledAt, timezone)}</span>
                        <span>•</span>
                        <span>{appointment.service?.name ?? 'General Consultation'}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </SurfaceCard>
        </div>
      </SurfaceCard>

      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        timezone={timezone}
        onClose={() => setSelectedAppointmentId(null)}
        onAppointmentUpdated={handleAppointmentUpdated}
      />
    </div>
  )
}

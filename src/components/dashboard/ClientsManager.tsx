'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Mail,
  Phone,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppointmentWithRelations, BillingTransaction, Client } from '@/types'
import { SurfaceCard, StatusBadge } from '@/components/dashboard/shared'
import { cn, formatCurrency } from '@/lib/utils'
import { AppointmentDetailsDrawer } from './AppointmentDetailsDrawer'
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  APPOINTMENT_SOURCE_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  formatDateTimeInTimeZone,
} from './appointments-utils'

type ClientRow = {
  client: Client
  appointments: AppointmentWithRelations[]
  lastVisitAt: string | null
  completedCount: number
  paidAmount: number
  searchText: string
}

type PaymentSummary = {
  label: string | null
  tone: 'slate' | 'amber' | 'blue' | 'emerald' | 'teal' | 'rose'
  amountLabel: string | null
}

function formatShortDate(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function buildSearchText(client: Client, appointments: AppointmentWithRelations[]) {
  return [
    client.name,
    client.phone,
    client.email,
    client.dateOfBirth,
    client.notes,
    ...appointments.flatMap((appointment) => [
      appointment.service?.name,
      appointment.status,
      appointment.paymentStatus,
      appointment.notes,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function sumTransactions(transactions: BillingTransaction[], status: BillingTransaction['status']) {
  return transactions
    .filter((transaction) => transaction.status === status)
    .reduce((total, transaction) => total + transaction.amount, 0)
}

function getAppointmentPaymentSummary(
  appointment: AppointmentWithRelations,
  transactions: BillingTransaction[],
  currency: string,
): PaymentSummary {
  const confirmedAmount = sumTransactions(transactions, 'confirmed')
  const refundedAmount = sumTransactions(transactions, 'refunded')

  if (appointment.paymentStatus === 'pending' || appointment.paymentStatus === 'not_required') {
    return {
      label: null,
      tone: PAYMENT_STATUS_TONE[appointment.paymentStatus],
      amountLabel: null,
    }
  }

  const amount =
    appointment.paymentStatus === 'refunded'
      ? refundedAmount > 0
        ? refundedAmount
        : confirmedAmount
      : confirmedAmount > 0
        ? confirmedAmount
        : appointment.paymentAmount ?? null

  return {
    label: PAYMENT_STATUS_LABEL[appointment.paymentStatus],
    tone: PAYMENT_STATUS_TONE[appointment.paymentStatus],
    amountLabel: amount != null && amount > 0 ? formatCurrency(amount, currency) : null,
  }
}

function MiniStat({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string
  value: string
  accent: 'teal' | 'amber' | 'blue' | 'rose'
  icon: LucideIcon
}) {
  const styleMap: Record<'teal' | 'amber' | 'blue' | 'rose', string> = {
    teal: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
    amber: 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-strong)]',
    blue: 'border-[var(--border-strong)] bg-white text-[var(--brand-strong)]',
    rose: 'border-[var(--coral)] bg-[var(--coral-soft)] text-[var(--coral)]',
  }

  return (
    <div className={cn('rounded-[20px] border px-4 py-3', styleMap[accent])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-70">{label}</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em]">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-[14px] border border-[currentColor]/20 bg-white/50">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border-soft)] bg-white/82 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)]">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <div className="mt-3 text-sm font-semibold text-[var(--text-strong)]">{value}</div>
    </div>
  )
}

function HistoryRow({
  appointment,
  transactions,
  timezone,
  currency,
  onView,
}: {
  appointment: AppointmentWithRelations
  transactions: BillingTransaction[]
  timezone: string
  currency: string
  onView: () => void
}) {
  const payment = getAppointmentPaymentSummary(appointment, transactions, currency)

  return (
    <div
      className={cn(
        'grid gap-3 px-4 py-4 transition md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_100px_120px_140px_72px] md:items-center',
        appointment.paymentStatus === 'partial' || appointment.paymentStatus === 'refunded'
          ? 'bg-[rgba(16,33,41,0.02)]'
          : 'bg-white/60',
      )}
    >
      <div className="min-w-0">
        <div className="font-semibold text-[var(--text-strong)]">
          {formatDateTimeInTimeZone(appointment.scheduledAt, timezone)}
        </div>
        <div className="mt-1 text-xs text-[var(--text-muted)]">{appointment.client?.name ?? 'Unknown client'}</div>
      </div>

      <div className="min-w-0">
        <div className="truncate font-semibold text-[var(--text-strong)]">{appointment.service?.name ?? 'General Consultation'}</div>
        <div className="mt-1 text-xs text-[var(--text-muted)]">
          {APPOINTMENT_SOURCE_LABEL[appointment.source] ?? appointment.source}
        </div>
      </div>

      <div className="font-semibold text-[var(--text-strong)]">
        {appointment.service?.durationMinutes ? `${appointment.service.durationMinutes} min` : '-'}
      </div>

      <div className="min-w-0">
        <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>{APPOINTMENT_STATUS_LABEL[appointment.status]}</StatusBadge>
      </div>

      <div className="min-w-0">
        {payment.label ? (
          <div>
            <StatusBadge tone={payment.tone}>{payment.label}</StatusBadge>
            <div className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">{payment.amountLabel ?? '-'}</div>
          </div>
        ) : (
          <div className="text-sm text-[var(--text-muted)]">-</div>
        )}
      </div>

      <div className="flex justify-start md:justify-end">
        <button
          type="button"
          onClick={onView}
          className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white"
        >
          <Eye className="mr-1 inline-block h-3.5 w-3.5" />
          View
        </button>
      </div>
    </div>
  )
}

function ClientCard({
  row,
  timezone,
  currency,
  paymentsByAppointmentId,
  expanded,
  onToggle,
  onViewAppointment,
}: {
  row: ClientRow
  timezone: string
  currency: string
  paymentsByAppointmentId: Record<string, BillingTransaction[]>
  expanded: boolean
  onToggle: () => void
  onViewAppointment: (appointmentId: string) => void
}) {
  const firstLetter = row.client.name.trim().slice(0, 1).toUpperCase() || 'P'
  const totalAppointments = row.appointments.length
  const lastVisitLabel = row.lastVisitAt ? formatShortDate(row.lastVisitAt, timezone) : '-'
  const paidLabel = row.paidAmount > 0 ? formatCurrency(row.paidAmount, currency) : '-'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border transition',
        expanded
          ? 'border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,240,231,0.92))]'
          : 'border-[var(--border-soft)] bg-white/82 hover:border-[var(--border-strong)]',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'grid w-full gap-4 px-4 py-4 text-left transition md:grid-cols-[minmax(0,1.55fr)_minmax(84px,0.58fr)_minmax(84px,0.58fr)_minmax(92px,0.7fr)_minmax(102px,0.72fr)_40px] md:items-center',
          expanded ? 'bg-[var(--brand-soft)]/35' : 'hover:bg-[rgba(16,33,41,0.02)]',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-sm font-bold text-white shadow-[0_16px_30px_-20px_rgba(21, 57, 142,0.75)]">
            {firstLetter}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-[var(--text-strong)]">{row.client.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {row.client.email ?? 'No email'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {row.client.phone ?? 'No phone'}
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 md:text-center">
          <div className="text-sm font-semibold text-[var(--text-strong)]">{totalAppointments}</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Appointments</div>
        </div>

        <div className="min-w-0 md:text-center">
          <div className="text-sm font-semibold text-[var(--text-strong)]">{row.completedCount}</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Completed</div>
        </div>

        <div className="min-w-0 md:text-center">
          <div className="text-sm font-semibold text-[var(--text-strong)]">{paidLabel}</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Paid</div>
        </div>

        <div className="min-w-0 md:text-center">
          <div className="text-sm font-semibold text-[var(--text-strong)]">{lastVisitLabel}</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Last Visit</div>
        </div>

        <div className="flex justify-start md:justify-end">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-soft)] bg-white/82 text-[var(--text-muted)]">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-[var(--border-soft)] bg-[rgba(16,33,41,0.02)] px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoTile label="Date of birth" value={row.client.dateOfBirth ?? 'Not on file'} icon={CalendarDays} />
            <InfoTile label="Notes" value={row.client.notes ?? 'No notes yet'} icon={FileText} />
          </div>

          <div className="mt-4 overflow-hidden rounded-[22px] border border-[var(--border-soft)] bg-white/76">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <CalendarDays className="h-4 w-4 text-[var(--brand)]" />
                Appointment History ({row.appointments.length})
              </div>
            </div>

            {row.appointments.length === 0 ? (
              <div className="px-4 py-8 text-sm text-[var(--text-muted)]">No appointments yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid gap-3 border-b border-[var(--border-soft)] bg-[rgba(16,33,41,0.03)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)] md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_100px_120px_140px_72px]">
                    <div>Date & Time</div>
                    <div>Service</div>
                    <div>Duration</div>
                    <div>Status</div>
                    <div>Payment</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="divide-y divide-[var(--border-soft)]">
                    {row.appointments.map((appointment) => (
                      <HistoryRow
                        key={appointment.id}
                        appointment={appointment}
                        transactions={paymentsByAppointmentId[appointment.id] ?? []}
                        timezone={timezone}
                        currency={currency}
                        onView={() => onViewAppointment(appointment.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ClientsManager({
  initialClients,
  appointments: initialAppointments,
  billingTransactions: initialBillingTransactions,
  timezone,
  businessName,
  paymentCurrency,
}: {
  initialClients: Client[]
  appointments: AppointmentWithRelations[]
  billingTransactions: BillingTransaction[]
  timezone: string
  businessName?: string
  paymentCurrency: string
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [billingMap, setBillingMap] = useState<Record<string, BillingTransaction[]>>(() => {
    const grouped: Record<string, BillingTransaction[]> = {}
    for (const transaction of initialBillingTransactions) {
      if (!transaction.appointmentId) continue
      if (!grouped[transaction.appointmentId]) grouped[transaction.appointmentId] = []
      grouped[transaction.appointmentId].push(transaction)
    }
    return grouped
  })
  const [query, setQuery] = useState('')
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [initialSelectionApplied, setInitialSelectionApplied] = useState(false)

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  )

  const clientRows = useMemo<ClientRow[]>(() => {
    const rows = initialClients.map((client) => {
      const clientAppointments = appointments
        .filter((appointment) => appointment.clientId === client.id)
        .sort((left, right) => new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime())

      const lastVisitAt = clientAppointments[0]?.scheduledAt ?? null
      const completedCount = clientAppointments.filter((appointment) => appointment.status === 'completed').length

      const paidAmount = clientAppointments.reduce((total, appointment) => {
        const txs = billingMap[appointment.id] ?? []
        const confirmed = txs.filter((transaction) => transaction.status === 'confirmed').reduce((sum, transaction) => sum + transaction.amount, 0)
        const refunded = txs.filter((transaction) => transaction.status === 'refunded').reduce((sum, transaction) => sum + transaction.amount, 0)
        return total + Math.max(confirmed - refunded, 0)
      }, 0)

      return {
        client,
        appointments: clientAppointments,
        lastVisitAt,
        completedCount,
        paidAmount,
        searchText: buildSearchText(client, clientAppointments),
      }
    })

    return rows.sort((left, right) => {
      const leftVisit = left.lastVisitAt ? new Date(left.lastVisitAt).getTime() : 0
      const rightVisit = right.lastVisitAt ? new Date(right.lastVisitAt).getTime() : 0
      if (rightVisit !== leftVisit) return rightVisit - leftVisit
      return new Date(right.client.createdAt).getTime() - new Date(left.client.createdAt).getTime()
    })
  }, [appointments, billingMap, initialClients])

  if (!initialSelectionApplied && clientRows[0]) {
    setInitialSelectionApplied(true)
    setExpandedClientId(clientRows[0].client.id)
  }

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return clientRows
    return clientRows.filter((row) => row.searchText.includes(normalized))
  }, [clientRows, query])

  const totalClients = initialClients.length
  const portalAccounts = initialClients.filter((client) => Boolean(client.authUserId)).length
  const totalAppointments = appointments.length
  const totalRevenue = Object.values(billingMap)
    .flat()
    .reduce((total, transaction) => {
      if (transaction.status === 'confirmed') return total + transaction.amount
      if (transaction.status === 'refunded') return total - transaction.amount
      return total
    }, 0)

  async function refreshAppointmentPayments(appointmentId: string) {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/payments`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !Array.isArray(data.transactions)) return

      const nextTransactions = data.transactions as BillingTransaction[]
      setBillingMap((current) => ({
        ...current,
        [appointmentId]: nextTransactions,
      }))
    } catch {
      // Keep the current snapshot if the refresh fails.
    }
  }

  function handleAppointmentUpdated(updated: AppointmentWithRelations) {
    setAppointments((current) => current.map((appointment) => (appointment.id === updated.id ? { ...appointment, ...updated } : appointment)))
    void refreshAppointmentPayments(updated.id)
  }

  function openAppointment(appointmentId: string) {
    setSelectedAppointmentId(appointmentId)
  }

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Clients</div>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text-strong)]">
                Client records and appointment history
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                Review client profiles, expand a row to inspect every appointment, and jump into the detail drawer to inspect payments or status changes.
              </p>
            </div>

            <div className="hidden rounded-[24px] border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-right backdrop-blur-sm lg:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Business</div>
              <div className="mt-1 font-display text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{businessName ?? 'Business'}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{portalAccounts} portal accounts</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-4">
            <MiniStat label="Total Clients" value={String(totalClients)} accent="teal" icon={Users} />
            <MiniStat label="Portal Accounts" value={String(portalAccounts)} accent="amber" icon={CheckCircle2} />
            <MiniStat label="Total Appointments" value={String(totalAppointments)} accent="blue" icon={CalendarDays} />
            <MiniStat label="Total Revenue" value={formatCurrency(totalRevenue, paymentCurrency)} accent="rose" icon={Wallet} />
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/86">
            <div className="border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Client Profiles
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                  {visibleRows.length} unique clients
                </h2>
                <p className="text-sm text-[var(--text-muted)]">click to expand appointment history</p>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="input-field w-full pl-11"
                />
              </div>
            </div>

            <div className="space-y-3 p-4">
              {visibleRows.length === 0 ? (
                <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                  No clients match your search.
                </div>
              ) : (
                visibleRows.map((row) => (
                  <ClientCard
                    key={row.client.id}
                    row={row}
                    timezone={timezone}
                    currency={paymentCurrency}
                    paymentsByAppointmentId={billingMap}
                    expanded={expandedClientId === row.client.id}
                    onToggle={() =>
                      setExpandedClientId((current) => (current === row.client.id ? null : row.client.id))
                    }
                    onViewAppointment={openAppointment}
                  />
                ))
              )}
            </div>
          </div>
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

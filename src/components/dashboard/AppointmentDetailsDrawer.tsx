'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  Phone,
  ReceiptText,
  RefreshCcw,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppointmentStatus, AppointmentWithRelations, BillingTransaction, PaymentStatus } from '@/types'
import { SurfaceCard, StatusBadge, Pill } from '@/components/dashboard/shared'
import { cn, formatCurrency } from '@/lib/utils'
import {
  APPOINTMENT_SOURCE_LABEL,
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  formatDateOnlyInTimeZone,
  formatDateTimeInTimeZone,
  formatTimeInTimeZone,
} from './appointments-utils'

type PaymentHistoryResponse = {
  transactions: BillingTransaction[]
  summary: {
    due: number | null
    paid: number
    remaining: number | null
    currency: string
  }
}

type PaymentAction =
  | 'payment:cash'
  | 'payment:partial'
  | 'payment:refund'

function getTransactionMethod(metadata: BillingTransaction['metadata']) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const method = (metadata as Record<string, unknown>).paymentMethod
  return typeof method === 'string' ? method : null
}

function getTransactionSource(metadata: BillingTransaction['metadata']) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const source = (metadata as Record<string, unknown>).source
  return typeof source === 'string' ? source : null
}

function shortHash(value: string) {
  if (value.length <= 14) return value
  return `${value.slice(0, 10)}...${value.slice(-4)}`
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'teal' | 'amber' | 'rose' | 'blue'
}) {
  const accentStyles: Record<'teal' | 'amber' | 'rose' | 'blue', string> = {
    teal: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
    amber: 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-strong)]',
    rose: 'border-[var(--coral)] bg-[var(--coral-soft)] text-[var(--coral)]',
    blue: 'border-[var(--border-strong)] bg-white text-[var(--brand-strong)]',
  }

  return (
    <div className={cn('rounded-[22px] border px-4 py-3', accentStyles[accent])}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-70">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em]">{value}</div>
    </div>
  )
}

export function AppointmentDetailsDrawer({
  appointment,
  timezone,
  onClose,
  onAppointmentUpdated,
}: {
  appointment: AppointmentWithRelations | null
  timezone: string
  onClose: () => void
  onAppointmentUpdated: (appointment: AppointmentWithRelations) => void
}) {
  const [history, setHistory] = useState<PaymentHistoryResponse | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [partialOpen, setPartialOpen] = useState(false)
  const [partialAmount, setPartialAmount] = useState('')
  const lastLoadedAppointmentId = useRef<string | null>(null)

  const dueAmount = history?.summary.due ?? appointment?.paymentAmount ?? appointment?.service?.price ?? null
  const paidAmount = history?.summary.paid ?? 0
  const remainingAmount = history?.summary.remaining ?? (dueAmount != null ? Math.max(dueAmount - paidAmount, 0) : null)
  const paymentCurrency = history?.summary.currency ?? appointment?.paymentCurrency ?? 'USD'
  const paymentTransactions = history?.transactions ?? []

  useEffect(() => {
    if (!appointment) {
      lastLoadedAppointmentId.current = null
      setHistory(null)
      setHistoryError(null)
      setPanelError(null)
      setPartialOpen(false)
      setPartialAmount('')
      return
    }

    if (lastLoadedAppointmentId.current === appointment.id) {
      return
    }
    lastLoadedAppointmentId.current = appointment.id

    const controller = new AbortController()

    async function loadPaymentHistory() {
      setHistoryLoading(true)
      setHistoryError(null)
      setPanelError(null)
      setPartialOpen(false)
      setPartialAmount('')

      try {
        const response = await fetch(`/api/appointments/${appointment!.id}/payments`, {
          signal: controller.signal,
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          setHistory(null)
          setHistoryError(data.error ?? 'No se pudo cargar el historial de pagos')
          return
        }

        const payload = data as PaymentHistoryResponse
        setHistory(payload)
        const defaultAmount =
          payload.summary.remaining && payload.summary.remaining > 0
            ? payload.summary.remaining
            : payload.summary.due ?? appointment!.paymentAmount ?? appointment!.service?.price ?? null
        if (defaultAmount != null && defaultAmount > 0) {
          setPartialAmount(String(Number(defaultAmount.toFixed(2))))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setHistory(null)
          setHistoryError(error instanceof Error ? error.message : 'No se pudo cargar el historial de pagos')
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false)
        }
      }
    }

    void loadPaymentHistory()

    return () => controller.abort()
  }, [appointment])

  useEffect(() => {
    if (!appointment) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [appointment, onClose])

  async function refreshPaymentHistory() {
    if (!appointment) return
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/payments`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setHistoryError(data.error ?? 'No se pudo cargar el historial de pagos')
        return
      }
      setHistory(data as PaymentHistoryResponse)
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'No se pudo cargar el historial de pagos')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function updateAppointmentStatus(status: AppointmentStatus) {
    if (!appointment) return
    setBusyAction(`status:${status}`)
    setPanelError(null)

    try {
      const response = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id, status }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setPanelError(data.error ?? 'No se pudo actualizar el estado de la cita')
        return
      }

      onAppointmentUpdated(data.appointment)
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : 'No se pudo actualizar el estado de la cita')
    } finally {
      setBusyAction(null)
    }
  }

  async function submitPayment(input: {
    amount: number
    appointmentPaymentStatus: PaymentStatus
    status: BillingTransaction['status']
    paymentType: BillingTransaction['paymentType']
    metadata: Record<string, unknown>
  }) {
    if (!appointment) return
    setPanelError(null)

    const action =
      input.appointmentPaymentStatus === 'cash'
        ? 'payment:cash'
        : input.appointmentPaymentStatus === 'partial'
          ? 'payment:partial'
          : 'payment:refund'
    setBusyAction(action)

    try {
      const response = await fetch('/api/appointments/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          amount: input.amount,
          currency: paymentCurrency,
          status: input.status,
          paymentType: input.paymentType,
          appointmentPaymentStatus: input.appointmentPaymentStatus,
          metadata: input.metadata,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setPanelError(data.error ?? 'No se pudo registrar el pago')
        return
      }

      onAppointmentUpdated(data.appointment)
      setPartialOpen(false)
      await refreshPaymentHistory()
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : 'No se pudo registrar el pago')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleCashPaid() {
    const amount = remainingAmount ?? dueAmount
    if (!amount || amount <= 0) {
      setPanelError('No hay un monto configurado para cobrar.')
      return
    }

    await submitPayment({
      amount,
      appointmentPaymentStatus: 'cash',
      status: 'confirmed',
      paymentType: 'full_payment',
      metadata: {
        paymentMethod: 'cash',
        source: 'appointments-drawer',
      },
    })
  }

  async function handlePartialPayment() {
    const amount = Number(partialAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setPanelError('Ingresa un monto parcial valido.')
      return
    }

    const target = remainingAmount ?? dueAmount
    const nextStatus: PaymentStatus = target != null && amount >= target ? 'cash' : 'partial'
    const nextType: BillingTransaction['paymentType'] = target != null && amount >= target ? 'full_payment' : 'booking_deposit'

    await submitPayment({
      amount,
      appointmentPaymentStatus: nextStatus,
      status: 'confirmed',
      paymentType: nextType,
      metadata: {
        paymentMethod: 'partial',
        source: 'appointments-drawer',
      },
    })
  }

  async function handleRefund() {
    const amount = paidAmount
    if (!amount || amount <= 0) {
      setPanelError('No hay pagos confirmados para reembolsar.')
      return
    }

    await submitPayment({
      amount,
      appointmentPaymentStatus: 'refunded',
      status: 'refunded',
      paymentType: 'full_payment',
      metadata: {
        paymentMethod: 'refund',
        source: 'appointments-drawer',
      },
    })
  }

  if (!appointment) return null

  const client = appointment.client
  const appointmentDate = formatDateOnlyInTimeZone(appointment.scheduledAt, timezone)
  const appointmentTime = formatTimeInTimeZone(appointment.scheduledAt, timezone)
  const paymentStatusTone = PAYMENT_STATUS_TONE[appointment.paymentStatus]
  const appointmentStatusTone = APPOINTMENT_STATUS_TONE[appointment.status]
  const targetAmountLabel = dueAmount != null ? formatCurrency(dueAmount, paymentCurrency) : 'Not configured'
  const paidAmountLabel = formatCurrency(paidAmount, paymentCurrency)
  const remainingAmountLabel = remainingAmount != null ? formatCurrency(remainingAmount, paymentCurrency) : 'Not configured'

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close appointment details"
        className="absolute inset-0 cursor-default bg-[rgba(8,16,20,0.42)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col overflow-hidden border-l border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,231,0.96))] shadow-[0_0_80px_-40px_rgba(15,33,41,0.6)]">
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.14)] bg-[linear-gradient(135deg,var(--surface-dark),#163640)] px-5 py-4 text-white">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[rgba(216,240,236,0.8)]">
              Appointment Details
            </div>
            <div className="mt-1 text-sm font-medium text-white/75">ID: {appointment.id.slice(0, 8)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/10 text-white/90 transition hover:bg-white/16 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={appointmentStatusTone}>{APPOINTMENT_STATUS_LABEL[appointment.status]}</StatusBadge>
              <StatusBadge tone={paymentStatusTone}>{PAYMENT_STATUS_LABEL[appointment.paymentStatus]}</StatusBadge>
              <Pill tone="slate">Real time</Pill>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Due" value={targetAmountLabel} accent="blue" />
              <StatCard label="Collected" value={paidAmountLabel} accent="teal" />
              <StatCard label="Remaining" value={remainingAmountLabel} accent={remainingAmount && remainingAmount > 0 ? 'rose' : 'amber'} />
            </div>

            {panelError ? (
              <div className="rounded-[22px] border border-[var(--coral)] bg-[var(--coral-soft)] px-4 py-3 text-sm font-medium text-[var(--coral)]">
                {panelError}
              </div>
            ) : null}

            <SurfaceCard className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <UserRound className="h-4 w-4 text-[var(--brand)]" />
                Client information
              </div>

              <div className="mt-4 space-y-3 rounded-[22px] border border-[var(--border-soft)] bg-white/78 p-4">
                <InfoRow label="Full name" value={client?.name ?? 'Unknown client'} icon={UserRound} />
                <InfoRow label="Phone" value={client?.phone ?? 'Not on file'} icon={Phone} />
                <InfoRow label="Email" value={client?.email ?? 'Not on file'} icon={Mail} />
                <InfoRow label="Date of birth" value={client?.dateOfBirth ?? 'Not on file'} icon={CalendarDays} />
                <InfoRow label="Source" value={APPOINTMENT_SOURCE_LABEL[appointment.source]} icon={ReceiptText} />
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <CalendarDays className="h-4 w-4 text-[var(--brand)]" />
                Appointment
              </div>

              <div className="mt-4 space-y-3 rounded-[22px] border border-[var(--border-soft)] bg-white/78 p-4">
                <InfoRow label="Scheduled" value={`${appointmentDate} at ${appointmentTime}`} icon={Clock3} />
                <InfoRow label="Service" value={appointment.service?.name ?? 'General Consultation'} icon={FileText} />
                <InfoRow label="Duration" value={appointment.service ? `${appointment.service.durationMinutes} minutes` : 'Not set'} icon={Clock3} />
                <InfoRow label="Agent" value={appointment.agent?.name ?? 'Clara AI'} icon={Wallet} />
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <FileText className="h-4 w-4 text-[var(--brand)]" />
                Notes
              </div>

              <div className="mt-4 rounded-[22px] border border-[var(--border-soft)] bg-white/78 p-4 text-sm leading-7 text-[var(--text-strong)]">
                {appointment.notes?.trim() ? appointment.notes : 'No notes recorded for this appointment.'}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  <Banknote className="h-4 w-4 text-[var(--brand)]" />
                  Payment management
                </div>
                <button
                  type="button"
                  onClick={() => void refreshPaymentHistory()}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-strong)] transition hover:border-[var(--border-strong)] hover:bg-white"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <StatCard label="Due" value={targetAmountLabel} accent="amber" />
                <StatCard label="Paid" value={paidAmountLabel} accent="teal" />
                <StatCard label="Balance" value={remainingAmountLabel} accent="rose" />
              </div>

              <div className="mt-4 space-y-3 rounded-[22px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,236,225,0.82))] p-4">
                <button
                  type="button"
                  disabled={busyAction === 'payment:cash' || dueAmount == null || dueAmount <= 0 || historyLoading}
                  onClick={() => void handleCashPaid()}
                  className="btn-primary w-full justify-center !rounded-[18px] !px-4 !py-3"
                >
                  {busyAction === 'payment:cash' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  Mark as Cash Paid
                </button>

                {!partialOpen ? (
                  <button
                    type="button"
                    disabled={historyLoading}
                    onClick={() => {
                      setPanelError(null)
                      setPartialOpen(true)
                      const baseAmount = remainingAmount ?? dueAmount
                      if (baseAmount != null && baseAmount > 0) {
                        setPartialAmount(String(Number(baseAmount.toFixed(2))))
                      }
                    }}
                    className="btn-secondary w-full justify-center !rounded-[18px] !px-4 !py-3"
                  >
                    <CreditCard className="h-4 w-4" />
                    Record Partial Payment
                  </button>
                ) : (
                  <div className="space-y-3 rounded-[18px] border border-[var(--border-soft)] bg-white/86 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Amount received now
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={partialAmount}
                      onChange={(event) => setPartialAmount(event.target.value)}
                      placeholder="Amount received"
                      className="input-field w-full"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyAction === 'payment:partial' || historyLoading}
                        onClick={() => void handlePartialPayment()}
                        className="btn-primary flex-1 justify-center !rounded-[18px] !px-4 !py-3"
                      >
                        {busyAction === 'payment:partial' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Save Partial
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartialOpen(false)}
                        className="btn-secondary !rounded-[18px] !px-4 !py-3 text-[var(--text-muted)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={busyAction === 'payment:refund' || paidAmount <= 0 || historyLoading}
                  onClick={() => void handleRefund()}
                  className="btn-secondary w-full justify-center !rounded-[18px] !px-4 !py-3 !text-[var(--coral)]"
                >
                  {busyAction === 'payment:refund' ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Issue Refund
                </button>
              </div>

              {historyError ? (
                <p className="mt-3 text-xs font-medium text-[var(--coral)]">{historyError}</p>
              ) : null}

              <div className="mt-4 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Payment history
                </div>
                {historyLoading ? (
                  <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/80 p-4 text-sm text-[var(--text-muted)]">
                    Loading payment history...
                  </div>
                ) : paymentTransactions.length === 0 ? (
                  <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/80 p-4 text-sm text-[var(--text-muted)]">
                    No payment records yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentTransactions.map((transaction) => {
                      const method = getTransactionMethod(transaction.metadata)
                      const source = getTransactionSource(transaction.metadata)
                      return (
                        <div key={transaction.id} className="rounded-[20px] border border-[var(--border-soft)] bg-white/82 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-bold text-[var(--text-strong)]">
                                  {transaction.paymentType.replace('_', ' ')}
                                </div>
                                {method ? <Pill tone="slate">{method}</Pill> : null}
                              </div>
                              <div className="mt-1 text-xs text-[var(--text-muted)]">
                                {formatDateTimeInTimeZone(transaction.createdAt, timezone)}
                              </div>
                              <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                                {shortHash(transaction.txHash)}
                                {source ? ` - ${source}` : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-[var(--text-strong)]">
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </div>
                              <StatusBadge tone={transactionStatusTone(transaction.status)}>
                                {transaction.status}
                              </StatusBadge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <ChevronRight className="h-4 w-4 text-[var(--brand)]" />
                Appointment actions
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={busyAction === 'status:confirmed'}
                  onClick={() => void updateAppointmentStatus('confirmed')}
                  className="btn-primary justify-center !rounded-[18px] !px-4 !py-3"
                >
                  {busyAction === 'status:confirmed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirm
                </button>
                <button
                  type="button"
                  disabled={busyAction === 'status:completed'}
                  onClick={() => void updateAppointmentStatus('completed')}
                  className="btn-secondary justify-center !rounded-[18px] !px-4 !py-3"
                >
                  {busyAction === 'status:completed' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark completed
                </button>
                <button
                  type="button"
                  disabled={busyAction === 'status:no_show'}
                  onClick={() => void updateAppointmentStatus('no_show')}
                  className="btn-secondary justify-center !rounded-[18px] !px-4 !py-3"
                >
                  {busyAction === 'status:no_show' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                  No show
                </button>
                <button
                  type="button"
                  disabled={busyAction === 'status:cancelled'}
                  onClick={() => void updateAppointmentStatus('cancelled')}
                  className="btn-secondary justify-center !rounded-[18px] !px-4 !py-3 !text-[var(--coral)]"
                >
                  {busyAction === 'status:cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Cancel
                </button>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </aside>
    </div>
  )
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border-soft)] bg-[var(--brand-soft)] text-[var(--brand-strong)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</div>
        <div className="mt-1 break-words text-sm font-semibold text-[var(--text-strong)]">{value}</div>
      </div>
    </div>
  )
}

function transactionStatusTone(status: BillingTransaction['status']) {
  if (status === 'confirmed') return 'emerald'
  if (status === 'refunded') return 'rose'
  if (status === 'failed') return 'slate'
  return 'amber'
}

'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Loader2, Wallet, X } from 'lucide-react'
import type { AppointmentWithRelations, AvailableSlot } from '@/types'
import { SurfaceCard, StatusBadge } from '@/components/dashboard/shared'
import Modal from '@/components/ui/Modal'
import { cn, formatCurrency } from '@/lib/utils'
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  formatDateTimeInTimeZone,
} from '@/components/dashboard/appointments-utils'

type ActiveModal =
  | { kind: 'cancel'; appointment: AppointmentWithRelations }
  | { kind: 'reschedule'; appointment: AppointmentWithRelations }
  | { kind: 'pay'; appointment: AppointmentWithRelations }
  | null

const ACTIONABLE_STATUSES = new Set(['scheduled', 'pending_confirmation', 'confirmed'])
const PAYABLE_STATUSES = new Set(['pending', 'partial'])

export function PortalAppointmentsManager({
  initialAppointments,
  timezone,
}: {
  initialAppointments: AppointmentWithRelations[]
  timezone: string
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [modal, setModal] = useState<ActiveModal>(null)

  function updateAppointment(updated: AppointmentWithRelations) {
    setAppointments((current) => current.map((appt) => (appt.id === updated.id ? { ...appt, ...updated } : appt)))
  }

  const sorted = [...appointments].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  return (
    <div className="space-y-6">
      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-6 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Appointments</div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)]">
            Reschedule, cancel, and review your visits
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
            Manage your bookings directly. The business is notified the moment you make a change.
          </p>
        </div>

        <div className="divide-y divide-[var(--border-soft)]">
          {sorted.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
              You don&apos;t have any appointments yet.
            </div>
          ) : (
            sorted.map((appointment) => {
              const canManage = ACTIONABLE_STATUSES.has(appointment.status)
              const canPay = PAYABLE_STATUSES.has(appointment.paymentStatus)
              return (
                <div key={appointment.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-[var(--text-strong)]">
                        {appointment.service?.name ?? 'Appointment'}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">
                        {formatDateTimeInTimeZone(appointment.scheduledAt, timezone)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                        {APPOINTMENT_STATUS_LABEL[appointment.status]}
                      </StatusBadge>
                      <StatusBadge tone={PAYMENT_STATUS_TONE[appointment.paymentStatus]}>
                        {PAYMENT_STATUS_LABEL[appointment.paymentStatus]}
                      </StatusBadge>
                    </div>
                  </div>

                  {appointment.status === 'cancelled' && appointment.cancellationReason ? (
                    <p className="mt-3 text-xs text-[var(--text-muted)]">Reason: {appointment.cancellationReason}</p>
                  ) : null}

                  {canManage || canPay ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => setModal({ kind: 'reschedule', appointment })}
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          <CalendarClock className="h-4 w-4" />
                          Reschedule
                        </button>
                      ) : null}
                      {canPay ? (
                        <button
                          type="button"
                          onClick={() => setModal({ kind: 'pay', appointment })}
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          <Wallet className="h-4 w-4" />
                          Pay in cash
                        </button>
                      ) : null}
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => setModal({ kind: 'cancel', appointment })}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] px-4 py-2 text-sm font-bold text-[var(--coral)] transition hover:bg-rose-50"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </SurfaceCard>

      <CancelModal
        appointment={modal?.kind === 'cancel' ? modal.appointment : null}
        onClose={() => setModal(null)}
        onCancelled={updateAppointment}
      />
      <RescheduleModal
        appointment={modal?.kind === 'reschedule' ? modal.appointment : null}
        timezone={timezone}
        onClose={() => setModal(null)}
        onRescheduled={updateAppointment}
      />
      <PayCashModal
        appointment={modal?.kind === 'pay' ? modal.appointment : null}
        onClose={() => setModal(null)}
        onPaid={updateAppointment}
      />
    </div>
  )
}

function CancelModal({
  appointment,
  onClose,
  onCancelled,
}: {
  appointment: AppointmentWithRelations | null
  onClose: () => void
  onCancelled: (updated: AppointmentWithRelations) => void
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!appointment) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/portal/appointments/${appointment.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || null }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'Could not cancel the appointment.')
        return
      }
      onCancelled(payload.appointment)
      setReason('')
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={Boolean(appointment)}
      title="Cancel appointment"
      description="The business will be notified right away. This cannot be undone."
      onClose={() => {
        setReason('')
        setError(null)
        onClose()
      }}
    >
      {appointment ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm">
            <div className="font-bold text-[var(--text-strong)]">{appointment.service?.name ?? 'Appointment'}</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-strong)]">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="input-field w-full"
              placeholder="Let the business know why you're cancelling..."
            />
          </div>
          {error ? <p className="text-sm font-medium text-[var(--coral)]">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleConfirm} disabled={loading} className="btn-primary flex-1 justify-center py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm cancellation
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-3">
              Keep appointment
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function RescheduleModal({
  appointment,
  timezone,
  onClose,
  onRescheduled,
}: {
  appointment: AppointmentWithRelations | null
  timezone: string
  onClose: () => void
  onRescheduled: (updated: AppointmentWithRelations) => void
}) {
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  useEffect(() => {
    if (!appointment) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setting loading state before an async fetch, not a render-sync anti-pattern
    setLoadingSlots(true)
    setSlots(null)
    setError(null)
    fetch(`/api/portal/appointments/${appointment.id}/slots`)
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled) setSlots(payload?.slots ?? [])
      })
      .catch(() => {
        if (!cancelled) setError('Could not load available times.')
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id])

  function resetAndClose() {
    setSlots(null)
    setSelectedSlot(null)
    setError(null)
    onClose()
  }

  async function handleConfirm() {
    if (!appointment || !selectedSlot) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/portal/appointments/${appointment.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: selectedSlot }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'Could not reschedule the appointment.')
        return
      }
      onRescheduled(payload.appointment)
      resetAndClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={Boolean(appointment)} title="Reschedule appointment" description="Pick a new time. Staff will confirm the change." onClose={resetAndClose}>
      {appointment ? (
        <div className="space-y-4">
          {loadingSlots ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading available times...
            </div>
          ) : slots && slots.length > 0 ? (
            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot.startAt}
                  type="button"
                  onClick={() => setSelectedSlot(slot.startAt)}
                  className={cn(
                    'rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition',
                    selectedSlot === slot.startAt
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                      : 'border-[var(--border-soft)] bg-white text-[var(--text-strong)] hover:bg-[var(--panel-soft)]'
                  )}
                >
                  {formatDateTimeInTimeZone(slot.startAt, timezone)}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">No open times in the next few days.</div>
          )}
          {error ? <p className="text-sm font-medium text-[var(--coral)]">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !selectedSlot}
              className="btn-primary flex-1 justify-center py-3"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm new time
            </button>
            <button type="button" onClick={resetAndClose} className="btn-secondary flex-1 justify-center py-3">
              Never mind
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function PayCashModal({
  appointment,
  onClose,
  onPaid,
}: {
  appointment: AppointmentWithRelations | null
  onClose: () => void
  onPaid: (updated: AppointmentWithRelations) => void
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const suggestedAmount = appointment?.paymentAmount ?? appointment?.service?.price ?? null

  function resetAndClose() {
    setAmount('')
    setError(null)
    setDone(false)
    onClose()
  }

  async function handleConfirm() {
    if (!appointment) return
    const numericAmount = Number(amount || suggestedAmount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/portal/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          amount: numericAmount,
          currency: 'CASH',
          paymentType: 'booking_deposit',
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'Could not record the payment.')
        return
      }
      if (payload.payment) {
        // Server-side, cash payments land as paymentStatus 'cash' (never
        // 'confirmed' - nothing has actually changed hands yet, see
        // /api/portal/record-payment). Mirror that here instead of reusing
        // the route's stale `appointment` field, which is fetched before
        // the payment write and wouldn't reflect it anyway.
        onPaid({ ...appointment, paymentStatus: 'cash', paymentAmount: appointment.paymentAmount ?? numericAmount, paymentCurrency: 'CASH' })
      }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={Boolean(appointment)} title="Pay in cash" description="Commit to paying at the business. Staff will mark it received when you arrive." onClose={resetAndClose}>
      {appointment ? (
        done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm leading-7 text-[var(--text-muted)]">
              Noted. The business knows you&apos;ll pay {suggestedAmount ? formatCurrency(Number(amount || suggestedAmount), appointment.paymentCurrency) : ''} in cash at your visit.
            </p>
            <button type="button" onClick={resetAndClose} className="btn-primary w-full justify-center py-3">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={suggestedAmount != null ? String(suggestedAmount) : '0.00'}
                className="input-field w-full"
              />
              {suggestedAmount != null ? (
                <p className="text-xs text-[var(--text-muted)]">Suggested amount: {formatCurrency(suggestedAmount, appointment.paymentCurrency)}</p>
              ) : null}
            </div>
            {error ? <p className="text-sm font-medium text-[var(--coral)]">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleConfirm} disabled={loading} className="btn-primary flex-1 justify-center py-3">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm
              </button>
              <button type="button" onClick={resetAndClose} className="btn-secondary flex-1 justify-center py-3">
                Cancel
              </button>
            </div>
          </div>
        )
      ) : null}
    </Modal>
  )
}

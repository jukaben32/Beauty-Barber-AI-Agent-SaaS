import type { AppointmentSource, AppointmentStatus, PaymentStatus } from '@/types'

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Booked',
  pending_confirmation: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
}

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, 'blue' | 'amber' | 'emerald' | 'rose' | 'teal'> = {
  scheduled: 'blue',
  pending_confirmation: 'amber',
  confirmed: 'emerald',
  completed: 'teal',
  cancelled: 'rose',
  no_show: 'amber',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  not_required: 'Not required',
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  cash: 'Cash paid',
  refunded: 'Refunded',
}

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, 'slate' | 'amber' | 'blue' | 'emerald' | 'teal' | 'rose'> = {
  not_required: 'slate',
  pending: 'amber',
  partial: 'blue',
  paid: 'emerald',
  cash: 'teal',
  refunded: 'rose',
}

export const APPOINTMENT_SOURCE_LABEL: Record<AppointmentSource, string> = {
  widget: 'Widget',
  portal: 'Portal',
  manual: 'Manual',
  ai_call: 'AI Call',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
}

export function formatDateTimeInTimeZone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDateOnlyInTimeZone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatTimeInTimeZone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

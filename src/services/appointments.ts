import type {
  Appointment,
  AppointmentSource,
  AppointmentStatus,
  AppointmentWithRelations,
  AvailableSlot,
  BillingPaymentType,
  BillingTransactionStatus,
  BusinessAvailability,
  Business,
  Service,
  Client,
  PublicBusinessProfile,
} from '@/types'
import { DEFAULT_APPOINTMENT_SLOT_MINUTES, DEFAULT_CURRENCY, DEFAULT_CHAIN_ID, DEFAULT_TIME_ZONE } from '@/constants'
import {
  buildTimeLabel,
  formatDateInTimeZone,
  formatTimeInTimeZone,
  getDateKeyInTimeZone,
  getDayOfWeekInTimeZone,
  isSameDayInTimeZone,
  toDate,
  zonedTimeToUtc,
} from './_shared'
import type { DbClient } from './_shared'
import { toClient } from './clients'
import { toService } from './services'

type AppointmentRow = any

type PublicAppointmentRow = any

function toAppointment(row: any): Appointment {
  return {
    id: row.id,
    businessId: row.business_id,
    clientId: row.client_id ?? null,
    agentId: row.agent_id ?? null,
    serviceId: row.service_id ?? null,
    conversationId: row.conversation_id ?? null,
    scheduledAt: row.scheduled_at,
    status: row.status,
    source: row.source,
    notes: row.notes ?? null,
    rescheduledFrom: row.rescheduled_from ?? null,
    requestedScheduledAt: row.requested_scheduled_at ?? null,
    rescheduleRequestedAt: row.reschedule_requested_at ?? null,
    confirmedAt: row.confirmed_at ?? null,
    cancelledAt: row.cancelled_at ?? null,
    cancellationReason: row.cancellation_reason ?? null,
    cancelledBy: row.cancelled_by ?? null,
    paymentStatus: row.payment_status,
    paymentAmount: row.payment_amount ?? null,
    paymentCurrency: row.payment_currency ?? DEFAULT_CURRENCY,
    paymentChainId: row.payment_chain_id ?? DEFAULT_CHAIN_ID,
    paymentTxHash: row.payment_tx_hash ?? null,
    paymentMethod: row.payment_method ?? null,
    paymentReference: row.payment_reference ?? null,
    reminderSentAt: row.reminder_sent_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRelation(row: AppointmentRow): AppointmentWithRelations {
  return {
    ...toAppointment(row),
    // row.clients/row.services come back snake_case from Supabase;
    // toClient/toService convert them to the camelCase shape the rest of
    // the app (AppointmentsManager, AppointmentDetailsDrawer, etc.) expects
    // — without this, fields like dateOfBirth/durationMinutes were always
    // undefined even though data existed.
    client: row.clients ? toClient(row.clients) : null,
    service: row.services ? toService(row.services) : null,
    agent: row.ai_agents ?? null,
  }
}

function toAvailability(row: any): BusinessAvailability {
  return {
    id: row.id,
    businessId: row.business_id,
    dayOfWeek: row.day_of_week,
    isActive: row.is_active,
    openTime: row.open_time,
    closeTime: row.close_time,
    breakStart: row.break_start ?? null,
    breakEnd: row.break_end ?? null,
    slotMinutes: row.slot_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getAppointmentDurationMinutes(row: AppointmentRow, fallback = DEFAULT_APPOINTMENT_SLOT_MINUTES) {
  return row.services?.duration_minutes || fallback
}

async function getBusinessForAppointment(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, specialty, description, logo_url, phone, booking_email, timezone, address, website, city, state, zip_code, payment_wallet_address, payment_chain_id, payment_currency, booking_deposit_amount')
    .eq('id', businessId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function getServiceForAppointment(supabase: DbClient, businessId: string, serviceId?: string | null) {
  if (!serviceId) return null
  const { data, error } = await supabase.from('services').select('*').eq('business_id', businessId).eq('id', serviceId).maybeSingle()
  if (error) throw error
  return data
}

async function getAvailabilityForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('business_availability').select('*').eq('business_id', businessId).order('day_of_week')
  if (error) throw error
  return (data ?? []).map(toAvailability)
}

async function getClosedDateKeys(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('closed_dates').select('blocked_date').eq('business_id', businessId)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.blocked_date))
}

async function getBookedAppointments(
  supabase: DbClient,
  businessId: string,
  fromIso: string,
  toIso: string
) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, services(duration_minutes)')
    .eq('business_id', businessId)
    .not('status', 'in', '(cancelled)')
    .gte('scheduled_at', fromIso)
    .lt('scheduled_at', toIso)
  if (error) throw error
  return (data ?? []) as AppointmentRow[]
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB
}

function parseTime(value: string) {
  const [hours, minutes, seconds = '0'] = value.split(':').map(Number)
  return { hours, minutes, seconds }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export async function listAppointmentsForBusiness(
  supabase: DbClient,
  businessId: string,
  filters: { status?: AppointmentStatus | 'all'; limit?: number; clientId?: string } = {}
) {
  let query = supabase
    .from('appointments')
    .select('*, clients(*), services(*), ai_agents(id, name, voice)')
    .eq('business_id', businessId)
    .order('scheduled_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as unknown as AppointmentRow[]).map(toRelation)
}

export async function listAppointmentsForClient(supabase: DbClient, businessId: string, clientId: string) {
  return listAppointmentsForBusiness(supabase, businessId, { clientId })
}

export async function getAppointmentById(supabase: DbClient, businessId: string, appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clients(*), services(*), ai_agents(id, name, voice)')
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .maybeSingle()
  if (error) throw error
  return data ? toRelation(data as unknown as AppointmentRow) : null
}

export async function getAppointmentPublic(supabase: DbClient, appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      '*, clients(*), services(*), ai_agents(id, name, voice), businesses(id, name, slug, specialty, description, logo_url, phone, booking_email, timezone, address, website, city, state, zip_code, payment_wallet_address, payment_chain_id, payment_currency)'
    )
    .eq('id', appointmentId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as unknown as PublicAppointmentRow
  return {
    ...toRelation(row),
    business: row.businesses ?? null,
  }
}

export async function listBusinessAvailability(supabase: DbClient, businessId: string) {
  return getAvailabilityForBusiness(supabase, businessId)
}

export async function getAvailableSlots(
  supabase: DbClient,
  businessId: string,
  opts: {
    fromDate?: Date
    daysAhead?: number
    serviceId?: string | null
  } = {}
): Promise<AvailableSlot[]> {
  const business = await getBusinessForAppointment(supabase, businessId)
  if (!business) return []

  const timezone = business.timezone || DEFAULT_TIME_ZONE
  const availability = await getAvailabilityForBusiness(supabase, businessId)
  const closedDateKeys = await getClosedDateKeys(supabase, businessId)

  const service = await getServiceForAppointment(supabase, businessId, opts.serviceId ?? null)
  const slotMinutes = service?.duration_minutes || DEFAULT_APPOINTMENT_SLOT_MINUTES

  const fromDate = opts.fromDate && !Number.isNaN(opts.fromDate.getTime()) ? opts.fromDate : new Date()
  const daysAhead = opts.daysAhead ?? 10
  const toDateRange = new Date(fromDate.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const bookedAppointments = await getBookedAppointments(supabase, businessId, fromDate.toISOString(), toDateRange.toISOString())

  const slots: AvailableSlot[] = []
  const cursor = new Date(fromDate)
  cursor.setHours(0, 0, 0, 0)

  for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset += 1) {
    const current = new Date(cursor.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    const dateKey = getDateKeyInTimeZone(current, timezone)
    if (closedDateKeys.has(dateKey)) continue

    const availabilityRow = availability.find((row) => row.dayOfWeek === getDayOfWeekInTimeZone(current, timezone))
    if (!availabilityRow || !availabilityRow.isActive) continue

    let slotStart = zonedTimeToUtc(dateKey, availabilityRow.openTime, timezone)
    const slotEndBoundary = zonedTimeToUtc(dateKey, availabilityRow.closeTime, timezone)

    while (slotStart.getTime() + slotMinutes * 60 * 1000 <= slotEndBoundary.getTime()) {
      const slotEnd = addMinutes(slotStart, slotMinutes)

      const breakStart = availabilityRow.breakStart ? zonedTimeToUtc(dateKey, availabilityRow.breakStart, timezone) : null
      const breakEnd = availabilityRow.breakEnd ? zonedTimeToUtc(dateKey, availabilityRow.breakEnd, timezone) : null
      if (breakStart && breakEnd && overlaps(slotStart, slotEnd, breakStart, breakEnd)) {
        slotStart = addMinutes(slotStart, slotMinutes)
        continue
      }

      const hasConflict = bookedAppointments.some((appointment) => {
        const apptStart = new Date(appointment.scheduled_at)
        const apptEnd = addMinutes(apptStart, getAppointmentDurationMinutes(appointment, slotMinutes))
        return overlaps(slotStart, slotEnd, apptStart, apptEnd)
      })

      if (!hasConflict) {
        slots.push({
          date: dateKey,
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          label: buildTimeLabel(dateKey, formatTimeInTimeZone(slotStart, timezone), formatTimeInTimeZone(slotEnd, timezone)),
          dayOfWeek: current.getUTCDay(),
        })
      }

      slotStart = addMinutes(slotStart, slotMinutes)
    }
  }

  return slots
}

export async function isSlotAvailable(
  supabase: DbClient,
  businessId: string,
  scheduledAt: string,
  durationMinutes: number
) {
  const business = await getBusinessForAppointment(supabase, businessId)
  if (!business) return false
  const timezone = business.timezone || DEFAULT_TIME_ZONE
  const start = new Date(scheduledAt)
  const end = addMinutes(start, durationMinutes)
  const dateKey = getDateKeyInTimeZone(start, timezone)
  const closedDateKeys = await getClosedDateKeys(supabase, businessId)
  if (closedDateKeys.has(dateKey)) return false

  const dayOfWeek = getDayOfWeekInTimeZone(start, timezone)
  const availability = await getAvailabilityForBusiness(supabase, businessId)
  const dayAvailability = availability.find((row) => row.dayOfWeek === dayOfWeek && row.isActive)
  if (!dayAvailability) return false

  const open = zonedTimeToUtc(dateKey, dayAvailability.openTime, timezone)
  const close = zonedTimeToUtc(dateKey, dayAvailability.closeTime, timezone)
  if (start < open || end > close) return false

  if (dayAvailability.breakStart && dayAvailability.breakEnd) {
    const breakStart = zonedTimeToUtc(dateKey, dayAvailability.breakStart, timezone)
    const breakEnd = zonedTimeToUtc(dateKey, dayAvailability.breakEnd, timezone)
    if (overlaps(start, end, breakStart, breakEnd)) return false
  }

  const bookedAppointments = await getBookedAppointments(supabase, businessId, start.toISOString(), end.toISOString())
  return !bookedAppointments.some((appointment) => {
    const apptStart = new Date(appointment.scheduled_at)
    const apptEnd = addMinutes(apptStart, getAppointmentDurationMinutes(appointment, durationMinutes))
    return overlaps(start, end, apptStart, apptEnd)
  })
}

export async function createAppointment(
  supabase: DbClient,
  businessId: string,
  input: {
    clientId?: string | null
    agentId?: string | null
    serviceId?: string | null
    conversationId?: string | null
    scheduledAt: string
    source?: AppointmentSource
    status?: AppointmentStatus
    notes?: string | null
    requestedScheduledAt?: string | null
    paymentStatus?: Appointment['paymentStatus']
  }
) {
  const business = await getBusinessForAppointment(supabase, businessId)
  if (!business) throw new Error('Business not found')

  const service = await getServiceForAppointment(supabase, businessId, input.serviceId ?? null)
  const durationMinutes = service?.duration_minutes || DEFAULT_APPOINTMENT_SLOT_MINUTES
  const available = await isSlotAvailable(supabase, businessId, input.scheduledAt, durationMinutes)
  if (!available) {
    throw new Error('Selected slot is no longer available')
  }

  const paymentAmount = service?.price ?? business.booking_deposit_amount ?? null
  const paymentStatus = input.paymentStatus ?? (paymentAmount ? 'pending' : 'not_required')

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      client_id: input.clientId ?? null,
      agent_id: input.agentId ?? null,
      service_id: input.serviceId ?? null,
      conversation_id: input.conversationId ?? null,
      scheduled_at: input.scheduledAt,
      source: input.source ?? 'widget',
      status: input.status ?? 'scheduled',
      notes: input.notes ?? null,
      requested_scheduled_at: input.requestedScheduledAt ?? null,
      payment_status: paymentStatus,
      payment_amount: paymentAmount,
      payment_currency: business.payment_currency || DEFAULT_CURRENCY,
      payment_chain_id: business.payment_chain_id || DEFAULT_CHAIN_ID,
    })
    .select('*, clients(*), services(*), ai_agents(id, name, voice)')
    .single()
  if (error) throw error
  return toRelation(data as unknown as AppointmentRow)
}

export async function updateAppointment(
  supabase: DbClient,
  businessId: string,
  appointmentId: string,
  patch: Partial<Appointment>
) {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      client_id: patch.clientId,
      agent_id: patch.agentId,
      service_id: patch.serviceId,
      conversation_id: patch.conversationId,
      scheduled_at: patch.scheduledAt,
      status: patch.status,
      source: patch.source,
      notes: patch.notes,
      rescheduled_from: patch.rescheduledFrom,
      requested_scheduled_at: patch.requestedScheduledAt,
      reschedule_requested_at: patch.rescheduleRequestedAt,
      confirmed_at: patch.confirmedAt,
      cancelled_at: patch.cancelledAt,
      cancellation_reason: patch.cancellationReason,
      cancelled_by: patch.cancelledBy,
      payment_status: patch.paymentStatus,
      payment_amount: patch.paymentAmount,
      payment_currency: patch.paymentCurrency,
      payment_chain_id: patch.paymentChainId,
      payment_tx_hash: patch.paymentTxHash,
      payment_method: patch.paymentMethod,
      payment_reference: patch.paymentReference,
      reminder_sent_at: patch.reminderSentAt,
    })
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .select('*, clients(*), services(*), ai_agents(id, name, voice)')
    .single()
  if (error) throw error
  return toRelation(data as unknown as AppointmentRow)
}

export async function updateAppointmentStatus(
  supabase: DbClient,
  businessId: string,
  appointmentId: string,
  status: AppointmentStatus,
  opts: { cancellationReason?: string | null; cancelledBy?: Appointment['cancelledBy'] } = {}
) {
  const patch: Partial<Appointment> = { status }
  if (status === 'confirmed') patch.confirmedAt = new Date().toISOString()
  if (status === 'cancelled') {
    patch.cancelledAt = new Date().toISOString()
    patch.cancellationReason = opts.cancellationReason ?? null
    patch.cancelledBy = opts.cancelledBy ?? 'business'
  }
  return updateAppointment(supabase, businessId, appointmentId, patch)
}

export async function confirmAppointment(supabase: DbClient, businessId: string, appointmentId: string) {
  return updateAppointmentStatus(supabase, businessId, appointmentId, 'confirmed')
}

export async function cancelAppointment(
  supabase: DbClient,
  businessId: string,
  appointmentId: string,
  reason?: string | null,
  cancelledBy: Appointment['cancelledBy'] = 'business'
) {
  return updateAppointmentStatus(supabase, businessId, appointmentId, 'cancelled', {
    cancellationReason: reason ?? null,
    cancelledBy,
  })
}

export async function rescheduleAppointment(
  supabase: DbClient,
  businessId: string,
  appointmentId: string,
  scheduledAt: string
) {
  const existing = await getAppointmentById(supabase, businessId, appointmentId)
  if (!existing) throw new Error('Appointment not found')

  const service = existing.service
  const durationMinutes = service?.durationMinutes || DEFAULT_APPOINTMENT_SLOT_MINUTES
  const available = await isSlotAvailable(supabase, businessId, scheduledAt, durationMinutes)
  if (!available) {
    throw new Error('Selected slot is no longer available')
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({
      scheduled_at: scheduledAt,
      rescheduled_from: existing.rescheduledFrom ?? existing.id,
      reschedule_requested_at: new Date().toISOString(),
      status: 'pending_confirmation',
    })
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .select('*, clients(*), services(*), ai_agents(id, name, voice)')
    .single()
  if (error) throw error
  return toRelation(data as unknown as AppointmentRow)
}

export async function recordAppointmentPayment(
  supabase: DbClient,
  businessId: string,
  appointmentId: string,
  input: {
    amount: number
    currency?: string
    chainId?: number
    txHash?: string
    status?: BillingTransactionStatus
    paymentType?: BillingPaymentType
    paymentMethod?: Appointment['paymentMethod']
    paymentReference?: string | null
    appointmentPaymentStatus?: Appointment['paymentStatus']
    metadata?: Record<string, unknown> | null
  }
) {
  const appointment = await getAppointmentById(supabase, businessId, appointmentId)
  if (!appointment) throw new Error('Appointment not found')

  const paymentAmount = appointment.paymentAmount ?? appointment.service?.price ?? input.amount
  const resolvedTxHash = input.txHash?.trim() || `booking-${appointmentId}-${crypto.randomUUID()}`

  const { error: insertError } = await supabase.from('billing_transactions').insert({
    business_id: businessId,
    appointment_id: appointmentId,
    client_id: appointment.clientId ?? null,
    amount: input.amount,
    currency: input.currency || DEFAULT_CURRENCY,
    chain_id: input.chainId || DEFAULT_CHAIN_ID,
    tx_hash: resolvedTxHash,
    status: input.status || 'pending',
    payment_type: input.paymentType || 'booking_deposit',
    payment_method: input.paymentMethod ?? null,
    payment_reference: input.paymentReference ?? null,
    metadata: input.metadata ?? null,
  })
  if (insertError) throw insertError

  const { data, error } = await supabase
    .from('appointments')
    .update({
      payment_status: input.appointmentPaymentStatus ?? (input.status === 'confirmed' ? 'paid' : 'pending'),
      payment_amount: paymentAmount,
      payment_currency: input.currency || appointment.paymentCurrency || DEFAULT_CURRENCY,
      payment_chain_id: input.chainId || DEFAULT_CHAIN_ID,
      payment_tx_hash: resolvedTxHash,
      payment_method: input.paymentMethod ?? null,
      payment_reference: input.paymentReference ?? null,
    })
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .select('*, clients(*), services(*), ai_agents(id, name, voice)')
    .single()
  if (error) throw error
  return toRelation(data as unknown as AppointmentRow)
}

export async function listAppointmentStatuses(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('status, count:id')
    .eq('business_id', businessId)
  if (error) throw error
  return data ?? []
}

export async function getClientAppointmentsForPortal(supabase: DbClient, clientAuthUserId: string) {
  const { data: clientRows, error: clientError } = await supabase.from('clients').select('id, business_id').eq('auth_user_id', clientAuthUserId)
  if (clientError) throw clientError
  const client = clientRows?.[0]
  if (!client) return []

  return listAppointmentsForBusiness(supabase, client.business_id, { clientId: client.id })
}

export async function getAvailabilityContext(supabase: DbClient, businessId: string) {
  const [availability, closedDates] = await Promise.all([
    getAvailabilityForBusiness(supabase, businessId),
    supabase.from('closed_dates').select('*').eq('business_id', businessId).order('blocked_date', { ascending: false }),
  ])

  if (closedDates.error) throw closedDates.error

  return {
    availability,
    closedDates: closedDates.data ?? [],
  }
}

import type { SupportMessage, SupportTicket } from '@/types'
import type { DbClient } from './_shared'

function toTicket(row: any): SupportTicket {
  const patientRow = Array.isArray(row.patients) ? row.patients[0] ?? null : row.patients ?? null
  const appointmentRow = Array.isArray(row.appointments) ? row.appointments[0] ?? null : row.appointments ?? null

  return {
    id: row.id,
    businessId: row.business_id,
    patientId: row.patient_id ?? null,
    appointmentId: row.appointment_id ?? null,
    subject: row.subject,
    description: row.description ?? null,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patient: patientRow
      ? {
          name: patientRow.name,
          email: patientRow.email ?? null,
          phone: patientRow.phone ?? null,
        }
      : null,
    appointment: appointmentRow
      ? {
          id: appointmentRow.id,
          scheduledAt: appointmentRow.scheduled_at,
          status: appointmentRow.status,
        }
      : null,
  }
}

function toMessage(row: any): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    businessId: row.business_id,
    senderType: row.sender_type,
    content: row.content,
    createdAt: row.created_at,
  }
}

export async function listSupportTickets(supabase: DbClient, businessId: string, opts: number | { limit?: number; patientId?: string } = 50) {
  const { limit = 50, patientId } = typeof opts === 'number' ? { limit: opts } : opts

  let query = supabase
    .from('support_tickets')
    .select('*, patients(name, email, phone), appointments(id, scheduled_at, status)')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toTicket)
}

export async function getSupportTicket(supabase: DbClient, businessId: string, ticketId: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*, patients(name, email, phone), appointments(id, scheduled_at, status)')
    .eq('business_id', businessId)
    .eq('id', ticketId)
    .maybeSingle()
  if (error) throw error
  return data ? toTicket(data) : null
}

export async function createSupportTicket(
  supabase: DbClient,
  businessId: string,
  input: {
    patientId?: string | null
    appointmentId?: string | null
    subject: string
    description?: string | null
    priority?: SupportTicket['priority']
    status?: SupportTicket['status']
  }
) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      business_id: businessId,
      patient_id: input.patientId ?? null,
      appointment_id: input.appointmentId ?? null,
      subject: input.subject,
      description: input.description ?? null,
      priority: input.priority ?? 'medium',
      status: input.status ?? 'open',
    })
    .select('*')
    .single()
  if (error) throw error
  return toTicket(data)
}

export async function updateSupportTicketStatus(supabase: DbClient, businessId: string, ticketId: string, status: SupportTicket['status']) {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('business_id', businessId)
    .eq('id', ticketId)
    .select('*')
    .single()
  if (error) throw error
  return toTicket(data)
}

export async function listSupportMessages(supabase: DbClient, businessId: string, ticketId: string) {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('business_id', businessId)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toMessage)
}

export async function appendSupportMessage(
  supabase: DbClient,
  businessId: string,
  ticketId: string,
  input: { senderType: SupportMessage['senderType']; content: string }
) {
  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      business_id: businessId,
      ticket_id: ticketId,
      sender_type: input.senderType,
      content: input.content,
    })
    .select('*')
    .single()
  if (error) throw error
  return toMessage(data)
}

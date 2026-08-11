import type { Conversation, ConversationMessage, ConversationStatus, ConversationOutcome, Sentiment } from '@/types'
import type { DbClient } from './_shared'

function toConversation(row: any): Conversation {
  return {
    id: row.id,
    businessId: row.business_id,
    agentId: row.agent_id ?? null,
    patientId: row.patient_id ?? null,
    appointmentId: row.appointment_id ?? null,
    channel: row.channel,
    status: row.status,
    outcome: row.outcome ?? null,
    sentiment: row.sentiment ?? null,
    durationSeconds: row.duration_seconds ?? 0,
    transcriptSummary: row.transcript_summary ?? null,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    createdAt: row.created_at,
  }
}

function toMessage(row: any): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    businessId: row.business_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }
}

export async function listConversationsForBusiness(supabase: DbClient, businessId: string, limit = 50) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, patients(name, phone, email), ai_agents(name), appointments(id, scheduled_at, status)')
    .eq('business_id', businessId)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(toConversation)
}

export async function getConversationById(supabase: DbClient, businessId: string, conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, patients(*), ai_agents(*), appointments(*)')
    .eq('business_id', businessId)
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  return data ? toConversation(data) : null
}

export async function createConversation(
  supabase: DbClient,
  businessId: string,
  input: {
    agentId?: string | null
    patientId?: string | null
    appointmentId?: string | null
    channel?: Conversation['channel']
    status?: ConversationStatus
    outcome?: ConversationOutcome | null
    sentiment?: Sentiment | null
    transcriptSummary?: string | null
  }
) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      business_id: businessId,
      agent_id: input.agentId ?? null,
      patient_id: input.patientId ?? null,
      appointment_id: input.appointmentId ?? null,
      channel: input.channel ?? 'widget_voice',
      status: input.status ?? 'in_progress',
      outcome: input.outcome ?? null,
      sentiment: input.sentiment ?? null,
      transcript_summary: input.transcriptSummary ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return toConversation(data)
}

export async function updateConversationStatus(
  supabase: DbClient,
  businessId: string,
  conversationId: string,
  patch: Partial<Conversation> & { status?: ConversationStatus }
) {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      agent_id: patch.agentId,
      patient_id: patch.patientId,
      appointment_id: patch.appointmentId,
      channel: patch.channel,
      status: patch.status,
      outcome: patch.outcome,
      sentiment: patch.sentiment,
      duration_seconds: patch.durationSeconds,
      transcript_summary: patch.transcriptSummary,
      started_at: patch.startedAt,
      ended_at: patch.endedAt,
    })
    .eq('business_id', businessId)
    .eq('id', conversationId)
    .select('*')
    .single()
  if (error) throw error
  return toConversation(data)
}

export async function listConversationMessages(supabase: DbClient, businessId: string, conversationId: string) {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('business_id', businessId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toMessage)
}

export async function appendConversationMessage(
  supabase: DbClient,
  businessId: string,
  conversationId: string,
  input: { role: ConversationMessage['role']; content: string }
) {
  const { data, error } = await supabase
    .from('conversation_messages')
    .insert({
      business_id: businessId,
      conversation_id: conversationId,
      role: input.role,
      content: input.content,
    })
    .select('*')
    .single()
  if (error) throw error
  return toMessage(data)
}

export async function linkConversationToAppointment(
  supabase: DbClient,
  businessId: string,
  conversationId: string,
  appointmentId: string
) {
  return updateConversationStatus(supabase, businessId, conversationId, { appointmentId })
}

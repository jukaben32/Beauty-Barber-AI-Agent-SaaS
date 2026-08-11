import { z } from 'zod'
import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import {
  appendConversationMessage,
  createConversation,
  getConversationById,
  listConversationMessages,
  listConversationsForBusiness,
  updateConversationStatus,
} from '@/services/conversations'

const conversationSchema = z.object({
  conversationId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  channel: z.enum(['widget_voice', 'widget_chat', 'phone', 'whatsapp']).optional(),
  status: z.enum(['in_progress', 'completed', 'failed']).optional(),
  outcome: z.enum(['booked_appointment', 'qualified_lead', 'no_action', 'escalated']).optional().nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional().nullable(),
  transcriptSummary: z.string().max(10000).optional().nullable(),
  message: z.string().max(10000).optional(),
  role: z.enum(['agent', 'caller', 'system']).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
})

export async function GET(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const url = new URL(request.url)
  const conversationId = url.searchParams.get('conversationId')
  const limit = Number(url.searchParams.get('limit') || 50)

  if (conversationId) {
    const conversation = await getConversationById(supabase, business.id, conversationId)
    if (!conversation) {
      return apiError('Conversation not found', 404)
    }
    const messages = await listConversationMessages(supabase, business.id, conversationId)
    return json({ conversation, messages })
  }

  const conversations = await listConversationsForBusiness(supabase, business.id, Number.isFinite(limit) ? limit : 50)
  return json({ conversations })
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = conversationSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid conversation payload', 422, { issues: parsed.error.flatten() })
  }

  if (parsed.data.conversationId && parsed.data.message) {
    const message = await appendConversationMessage(supabase, business.id, parsed.data.conversationId, {
      role: parsed.data.role || 'caller',
      content: parsed.data.message,
    })
    return json({ message }, { status: 201 })
  }

  const conversation = await createConversation(supabase, business.id, {
    agentId: parsed.data.agentId ?? null,
    patientId: parsed.data.patientId ?? null,
    appointmentId: parsed.data.appointmentId ?? null,
    channel: parsed.data.channel ?? 'widget_voice',
    status: parsed.data.status ?? 'in_progress',
    outcome: parsed.data.outcome ?? null,
    sentiment: parsed.data.sentiment ?? null,
    transcriptSummary: parsed.data.transcriptSummary ?? null,
  })

  if (parsed.data.message) {
    await appendConversationMessage(supabase, business.id, conversation.id, {
      role: parsed.data.role || 'caller',
      content: parsed.data.message,
    })
  }

  return json({ conversation }, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = conversationSchema.safeParse(body)
  if (!parsed.success || !parsed.data.conversationId) {
    return apiError('Invalid conversation payload', 422, { issues: parsed.success ? null : parsed.error.flatten() })
  }

  const conversation = await updateConversationStatus(supabase, business.id, parsed.data.conversationId, {
    agentId: parsed.data.agentId ?? undefined,
    patientId: parsed.data.patientId ?? undefined,
    appointmentId: parsed.data.appointmentId ?? undefined,
    channel: parsed.data.channel,
    status: parsed.data.status,
    outcome: parsed.data.outcome ?? undefined,
    sentiment: parsed.data.sentiment ?? undefined,
    durationSeconds: parsed.data.durationSeconds,
    transcriptSummary: parsed.data.transcriptSummary ?? undefined,
    startedAt: parsed.data.startedAt,
    endedAt: parsed.data.endedAt,
  })

  return json({ conversation })
}

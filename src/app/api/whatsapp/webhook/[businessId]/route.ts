import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json } from '@/lib/api'
import { getBusinessById } from '@/services/business'
import { getAgentById } from '@/services/agents'
import { appendConversationMessage, createConversation, listConversationMessages } from '@/services/conversations'
import { findOrCreateClient } from '@/services/clients'
import { listServices } from '@/services/services'
import { listKnowledgeDocuments } from '@/services/faqs'
import { getWhatsappConnection, sendWhatsappMessage } from '@/services/whatsapp'
import { runWhatsappAgentTurn } from '@/ai/textAgent'

const SESSION_WINDOW_MS = 6 * 60 * 60 * 1000

type RecentConversationRow = {
  id: string
  started_at: string
  status: 'in_progress' | 'completed' | 'failed'
}

function extractInboundText(data: Record<string, unknown>): string | null {
  const message = data.message as Record<string, unknown> | undefined
  if (!message) return null

  if (typeof message.conversation === 'string') return message.conversation

  const extended = message.extendedTextMessage as { text?: string } | undefined
  if (typeof extended?.text === 'string') return extended.text

  return null
}

function verifyToken(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  if (expectedBuf.length !== providedBuf.length) return false
  return timingSafeEqual(expectedBuf, providedBuf)
}

export async function POST(request: Request, { params }: { params: { businessId: string } }) {
  const supabase = createAdminClient()

  const connection = await getWhatsappConnection(supabase, params.businessId)
  if (!connection || !connection.is_enabled || !connection.agent_id) {
    return json({ ok: true })
  }

  // The webhook URL registered with Evolution API embeds the instance token
  // as a shared secret (see connectWhatsapp in services/whatsapp.ts). Reject
  // any POST that doesn't present it — otherwise anyone who learns/guesses a
  // businessId could post forged WhatsApp events for that business.
  const providedToken = new URL(request.url).searchParams.get('token')
  if (!connection.instance_token || !providedToken || !verifyToken(connection.instance_token, providedToken)) {
    return apiError('Unauthorized', 401)
  }

  const payload = await request.json().catch(() => null)
  if (!payload) {
    return json({ ok: true })
  }

  const event = String(payload.event ?? '').toUpperCase()
  if (event && event !== 'MESSAGES_UPSERT') {
    return json({ ok: true })
  }

  const data = payload.data as Record<string, unknown> | undefined
  const key = data?.key as { remoteJid?: string; fromMe?: boolean } | undefined
  if (!data || !key || key.fromMe) {
    return json({ ok: true })
  }

  const remoteJid = typeof key.remoteJid === 'string' ? key.remoteJid : null
  const text = extractInboundText(data)
  if (!remoteJid || remoteJid.endsWith('@g.us') || !text) {
    return json({ ok: true })
  }

  const phone = remoteJid.split('@')[0].replace(/\D/g, '')
  if (!phone) {
    return json({ ok: true })
  }

  const pushName = typeof data.pushName === 'string' ? data.pushName : null

  const [business, agent, services, faqs] = await Promise.all([
    getBusinessById(supabase, params.businessId),
    getAgentById(supabase, params.businessId, connection.agent_id),
    listServices(supabase, params.businessId),
    listKnowledgeDocuments(supabase, params.businessId, true),
  ])

  if (!business || !agent || agent.status !== 'live') {
    return json({ ok: true })
  }

  try {
    await supabase
      .from('whatsapp_connections')
      .update({
        status: 'connected',
        phone_number: phone,
      })
      .eq('id', connection.id)
  } catch {
    // Best effort only.
  }

  const client = await findOrCreateClient(supabase, params.businessId, {
    name: pushName || 'WhatsApp contact',
    phone,
    source: 'whatsapp',
  })

  const { data: recentConversationData } = await supabase
    .from('conversations')
    .select('id, started_at, status')
    .eq('business_id', params.businessId)
    .eq('client_id', client.id)
    .eq('channel', 'whatsapp')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const recentConversation = recentConversationData as RecentConversationRow | null
  const isSameSession =
    !!recentConversation && Date.now() - new Date(recentConversation.started_at).getTime() < SESSION_WINDOW_MS

  if (recentConversation && !isSameSession && recentConversation.status === 'in_progress') {
    await supabase
      .from('conversations')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', recentConversation.id)
  }

  let conversationId: string
  if (recentConversation && isSameSession) {
    conversationId = recentConversation.id
  } else {
    conversationId = (
      await createConversation(supabase, params.businessId, {
        agentId: agent.id,
        clientId: client.id,
        channel: 'whatsapp',
        status: 'in_progress',
      })
    ).id
  }

  await appendConversationMessage(supabase, params.businessId, conversationId, {
    role: 'caller',
    content: text,
  })

  const historyRows = await listConversationMessages(supabase, params.businessId, conversationId)
  const history = historyRows
    .slice(-20)
    .filter((message) => message.role === 'caller' || message.role === 'agent')
    .map((message) => ({
      role: message.role === 'caller' ? ('user' as const) : ('assistant' as const),
      content: message.content,
    }))

  await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 1800))

  let reply = ''
  try {
    reply = await runWhatsappAgentTurn(supabase, {
      business,
      agent,
      services,
      faqs,
      businessId: params.businessId,
      conversationId,
      history,
    })
  } catch (error) {
    console.error('[whatsapp webhook] agent turn failed', error)
    reply = 'Lo siento, tuvimos un problema tecnico. En breve te contacta alguien del equipo.'
  }

  if (!reply.trim()) {
    reply = 'Gracias. En breve te respondo con mas detalles.'
  }

  await appendConversationMessage(supabase, params.businessId, conversationId, {
    role: 'agent',
    content: reply,
  })

  try {
    await sendWhatsappMessage(connection, phone, reply)
  } catch (error) {
    console.error('[whatsapp webhook] failed to send reply', error)
  }

  return json({ ok: true })
}

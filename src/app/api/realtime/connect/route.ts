import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { resolveRealtimeBookingContext } from '@/lib/realtime'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { realtimeTools } from '@/ai/tools'
import { findOrCreateClient } from '@/services/clients'
import { createConversation, linkConversationToAppointment } from '@/services/conversations'
import { realtimeSessionSchema } from '@/validations'

const connectSchema = realtimeSessionSchema.extend({
  clientName: z.string().max(120).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().max(40).optional(),
  appointmentId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = connectSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid realtime connect payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  const rateLimit = await checkRateLimit(admin, { key: `realtime-connect:${getClientIp(request)}`, limit: 20, windowSeconds: 60 })
  if (!rateLimit.allowed) {
    return apiError('Too many requests. Please try again in a moment.', 429)
  }

  try {
    const context = await resolveRealtimeBookingContext(admin, {
      businessSlug: parsed.data.businessSlug,
      widgetSlug: parsed.data.widgetSlug ?? null,
      language: parsed.data.language ?? 'en',
    })

    const hasClientDetails = Boolean(parsed.data.clientName || parsed.data.clientEmail || parsed.data.clientPhone)
    let client = null
    let conversation = null

    if (hasClientDetails || parsed.data.appointmentId) {
      client = await findOrCreateClient(admin, context.business.id, {
        name: parsed.data.clientName || 'Unknown client',
        email: parsed.data.clientEmail ?? null,
        phone: parsed.data.clientPhone ?? null,
        source: 'widget_chat',
      })

      conversation = await createConversation(admin, context.business.id, {
        clientId: client.id,
        appointmentId: parsed.data.appointmentId ?? null,
        channel: parsed.data.mode === 'chat' ? 'widget_chat' : 'widget_voice',
        status: 'in_progress',
      })

      if (parsed.data.appointmentId) {
        conversation = await linkConversationToAppointment(admin, context.business.id, conversation.id, parsed.data.appointmentId)
      }
    }

    return json({
      business: context.business,
      widget: context.widget,
      instructions: context.context.instructions,
      session: context.session,
      tools: realtimeTools,
      client,
      conversation,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect realtime session'
    return apiError(message, 404)
  }
}

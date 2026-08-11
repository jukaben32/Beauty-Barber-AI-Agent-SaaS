import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { resolveRealtimeClinicContext } from '@/lib/realtime'
import { clinicRealtimeTools } from '@/ai/tools'
import { findOrCreatePatient } from '@/services/patients'
import { createConversation, linkConversationToAppointment } from '@/services/conversations'
import { realtimeSessionSchema } from '@/validations'

const connectSchema = realtimeSessionSchema.extend({
  patientName: z.string().max(120).optional(),
  patientEmail: z.string().email().optional(),
  patientPhone: z.string().max(40).optional(),
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

  try {
    const context = await resolveRealtimeClinicContext(admin, {
      businessSlug: parsed.data.businessSlug,
      widgetSlug: parsed.data.widgetSlug ?? null,
      language: parsed.data.language ?? 'en',
    })

    const hasPatientDetails = Boolean(parsed.data.patientName || parsed.data.patientEmail || parsed.data.patientPhone)
    let patient = null
    let conversation = null

    if (hasPatientDetails || parsed.data.appointmentId) {
      patient = await findOrCreatePatient(admin, context.business.id, {
        name: parsed.data.patientName || 'Unknown patient',
        email: parsed.data.patientEmail ?? null,
        phone: parsed.data.patientPhone ?? null,
        source: 'widget_chat',
      })

      conversation = await createConversation(admin, context.business.id, {
        patientId: patient.id,
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
      tools: clinicRealtimeTools,
      patient,
      conversation,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to connect realtime session'
    return apiError(message, 404)
  }
}

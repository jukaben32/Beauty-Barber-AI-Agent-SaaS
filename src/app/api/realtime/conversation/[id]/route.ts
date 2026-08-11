import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { getPublicBusinessProfile } from '@/services/business'
import { updateConversationStatus } from '@/services/conversations'
import { realtimeConversationEndSchema } from '@/validations'

// Called both mid-call (to link the client/appointment a tool call just
// created or found, so the Call Log row points at them) and on disconnect
// (to close the conversation out with a duration and status).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = realtimeConversationEndSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid conversation update payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  try {
    const business = await getPublicBusinessProfile(admin, parsed.data.businessSlug)
    if (!business) {
      return apiError('Business not found', 404)
    }

    const conversation = await updateConversationStatus(admin, business.id, params.id, {
      clientId: parsed.data.clientId,
      appointmentId: parsed.data.appointmentId,
      durationSeconds: parsed.data.durationSeconds,
      status: parsed.data.durationSeconds !== undefined ? 'completed' : undefined,
      endedAt: parsed.data.durationSeconds !== undefined ? new Date().toISOString() : undefined,
      outcome: parsed.data.appointmentId ? 'booked_appointment' : undefined,
    })

    return json({ conversation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update conversation'
    return apiError(message, 500)
  }
}

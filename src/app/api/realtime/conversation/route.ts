import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { getPublicBusinessProfile } from '@/services/business'
import { createConversation } from '@/services/conversations'
import { realtimeConversationStartSchema } from '@/validations'

// Starts a conversation row the moment a realtime voice call connects, so it
// shows up in the dashboard Call Log even if the caller hangs up before
// booking anything. Messages are appended as the call progresses (see
// [id]/message/route.ts) and the row is closed out on disconnect (see
// [id]/route.ts).
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = realtimeConversationStartSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid conversation payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  try {
    const business = await getPublicBusinessProfile(admin, parsed.data.businessSlug)
    if (!business) {
      return apiError('Business not found', 404)
    }

    const conversation = await createConversation(admin, business.id, {
      agentId: parsed.data.agentId ?? null,
      channel: 'widget_voice',
      status: 'in_progress',
    })

    return json({ conversationId: conversation.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start conversation'
    return apiError(message, 500)
  }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { getPublicBusinessProfile } from '@/services/business'
import { appendConversationMessage } from '@/services/conversations'
import { realtimeConversationMessageSchema } from '@/validations'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = realtimeConversationMessageSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid conversation message payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  try {
    const business = await getPublicBusinessProfile(admin, parsed.data.businessSlug)
    if (!business) {
      return apiError('Business not found', 404)
    }

    const message = await appendConversationMessage(admin, business.id, params.id, {
      role: parsed.data.role,
      content: parsed.data.content,
    })

    return json({ message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to append conversation message'
    return apiError(message, 500)
  }
}

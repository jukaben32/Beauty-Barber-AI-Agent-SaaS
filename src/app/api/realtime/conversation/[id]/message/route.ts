import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { getPublicBusinessProfile } from '@/services/business'
import { appendConversationMessage } from '@/services/conversations'
import { realtimeConversationMessageSchema } from '@/validations'

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const rateLimit = await checkRateLimit(admin, { key: `realtime-message:${getClientIp(request)}`, limit: 60, windowSeconds: 60 })
  if (!rateLimit.allowed) {
    return apiError('Too many requests. Please try again in a moment.', 429)
  }

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

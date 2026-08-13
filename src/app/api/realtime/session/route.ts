import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { resolveRealtimeBookingContext } from '@/lib/realtime'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { realtimeTools } from '@/ai/tools'
import { realtimeSessionSchema } from '@/validations'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = realtimeSessionSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid realtime session payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  const rateLimit = await checkRateLimit(admin, { key: `realtime-session:${getClientIp(request)}`, limit: 20, windowSeconds: 60 })
  if (!rateLimit.allowed) {
    return apiError('Too many requests. Please try again in a moment.', 429)
  }

  try {
    const context = await resolveRealtimeBookingContext(admin, {
      businessSlug: parsed.data.businessSlug,
      widgetSlug: parsed.data.widgetSlug ?? null,
      voice: parsed.data.voice ?? null,
      language: parsed.data.language ?? null,
    })

    return json({
      business: context.business,
      widget: context.widget,
      instructions: context.context.instructions,
      session: context.session,
      tools: realtimeTools,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create realtime session'
    return apiError(message, 404)
  }
}

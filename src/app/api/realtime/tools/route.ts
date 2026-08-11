import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { resolveRealtimeClinicContext } from '@/lib/realtime'
import { executeRealtimeToolCall } from '@/ai/tools'
import { realtimeToolRequestSchema } from '@/validations'

const toolSchema = realtimeToolRequestSchema.extend({
  businessSlug: z.string().min(2),
  widgetSlug: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = toolSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid realtime tool payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  try {
    const context = await resolveRealtimeClinicContext(admin, {
      businessSlug: parsed.data.businessSlug,
      widgetSlug: parsed.data.widgetSlug ?? null,
    })

    const result = await executeRealtimeToolCall(admin, context.business.id, parsed.data.toolName, parsed.data.arguments)
    return json({
      business: context.business,
      widget: context.widget,
      toolName: parsed.data.toolName,
      result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to execute realtime tool'
    return apiError(message, 400)
  }
}

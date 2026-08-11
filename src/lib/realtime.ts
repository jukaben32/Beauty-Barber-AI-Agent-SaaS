import { buildRealtimeContext, buildRealtimeSessionPayload } from '@/ai/tools'
import { getPublicBusinessProfile } from '@/services/business'
import { getPublicWidgetConfig } from '@/services/widgets'
import type { DbClient } from '@/services/_shared'

export async function resolveRealtimeClinicContext(
  supabase: DbClient,
  input: {
    businessSlug: string
    widgetSlug?: string | null
    voice?: string | null
    language?: string | null
  }
) {
  const [business, widget] = await Promise.all([
    getPublicBusinessProfile(supabase, input.businessSlug),
    getPublicWidgetConfig(supabase, input.businessSlug, input.widgetSlug ?? null),
  ])

  if (!business) {
    throw new Error('Business not found')
  }

  const context = await buildRealtimeContext(supabase, business.id)
  const session = buildRealtimeSessionPayload({
    instructions: context.instructions,
    voice: input.voice || widget?.agentVoice || 'alloy',
    language: input.language || widget?.agentLanguage || 'en',
  })

  return {
    business,
    widget,
    context,
    session,
  }
}

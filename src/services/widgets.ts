import type { Widget, WidgetConfig } from '@/types'
import { DEFAULT_APPOINTMENT_SLOT_MINUTES, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR, DEFAULT_WIDGET_TONE, DEFAULT_WELCOME_MESSAGE } from '@/constants'
import type { DbClient } from './_shared'

export type WidgetListItem = Widget & {
  agentName: string | null
}

function toWidget(row: any): Widget {
  return {
    id: row.id,
    businessId: row.business_id,
    agentId: row.agent_id ?? null,
    name: row.name,
    slug: row.slug,
    enabled: row.enabled,
    position: row.position ?? 'bottom-right',
    theme: row.theme ?? 'light',
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    tone: row.tone,
    welcomeMessage: row.greeting_message,
    allowedOrigins: row.allowed_origins ?? [],
    slotDuration: row.slot_duration ?? DEFAULT_APPOINTMENT_SLOT_MINUTES,
    showBranding: row.show_branding,
    impressions: row.impressions ?? 0,
    interactions: row.interactions ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getBusinessAndAgentNames(supabase: DbClient, businessId: string, agentId: string | null) {
  const [{ data: business }, { data: agent }] = await Promise.all([
    supabase.from('businesses').select('name, slug').eq('id', businessId).maybeSingle(),
    agentId ? supabase.from('ai_agents').select('name, voice, language').eq('id', agentId).maybeSingle() : Promise.resolve({ data: null }),
  ])

  return {
    business,
    agent,
  }
}

export async function listWidgetsForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('widgets')
    .select('*, ai_agents(name, voice)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map((row: any): WidgetListItem => {
    const widget = toWidget(row)
    return {
      ...widget,
      agentName: row.ai_agents?.name ?? null,
    }
  })
}

export async function getWidgetById(supabase: DbClient, businessId: string, widgetId: string) {
  const { data, error } = await supabase.from('widgets').select('*').eq('business_id', businessId).eq('id', widgetId).maybeSingle()
  if (error) throw error
  return data ? toWidget(data) : null
}

export async function getWidgetForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toWidget(data) : null
}

export async function getWidgetBySlug(supabase: DbClient, businessSlug: string, widgetSlug?: string | null) {
  const { data: business, error: businessError } = await supabase.from('businesses').select('id').eq('slug', businessSlug).maybeSingle()
  if (businessError) throw businessError
  if (!business) return null

  let query = supabase.from('widgets').select('*').eq('business_id', business.id).eq('enabled', true)
  query = widgetSlug ? query.eq('slug', widgetSlug) : query.order('created_at', { ascending: false })

  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw error
  return data ? toWidget(data) : null
}

export async function getPublicWidgetConfig(supabase: DbClient, businessSlug: string, widgetSlug?: string | null) {
  const widget = await getWidgetBySlug(supabase, businessSlug, widgetSlug)
  if (!widget) return null
  const { business, agent } = await getBusinessAndAgentNames(supabase, widget.businessId, widget.agentId)

  const config: WidgetConfig = {
    ...widget,
    businessName: business?.name ?? businessSlug,
    businessSlug: business?.slug ?? businessSlug,
    agentName: agent?.name ?? null,
    agentVoice: agent?.voice ?? null,
    agentLanguage: agent?.language ?? null,
  }

  return config
}

export async function createWidget(
  supabase: DbClient,
  businessId: string,
  input: {
    name?: string
    slug: string
    agentId?: string | null
    enabled?: boolean
    position?: string
    theme?: string
    primaryColor?: string
    secondaryColor?: string
    tone?: string
    greetingMessage?: string
    allowedOrigins?: string[]
    slotDuration?: number
    showBranding?: boolean
  }
) {
  const { data, error } = await supabase
    .from('widgets')
    .insert({
      business_id: businessId,
      agent_id: input.agentId ?? null,
      name: input.name ?? 'Primary Widget',
      slug: input.slug,
      enabled: input.enabled ?? true,
      position: input.position ?? 'bottom-right',
      theme: input.theme ?? 'light',
      primary_color: input.primaryColor ?? DEFAULT_PRIMARY_COLOR,
      secondary_color: input.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
      tone: input.tone ?? DEFAULT_WIDGET_TONE,
      greeting_message: input.greetingMessage ?? DEFAULT_WELCOME_MESSAGE,
      allowed_origins: input.allowedOrigins ?? [],
      slot_duration: input.slotDuration ?? DEFAULT_APPOINTMENT_SLOT_MINUTES,
      show_branding: input.showBranding ?? true,
    })
    .select('*')
    .single()
  if (error) throw error
  return toWidget(data)
}

export async function updateWidget(
  supabase: DbClient,
  businessId: string,
  widgetId: string,
  input: Partial<Widget> & { name?: string; position?: string; theme?: string }
) {
  const { data, error } = await supabase
    .from('widgets')
    .update({
      name: input.name,
      agent_id: input.agentId,
      slug: input.slug,
      enabled: input.enabled,
      position: input.position,
      theme: input.theme,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      tone: input.tone,
      greeting_message: input.welcomeMessage,
      allowed_origins: input.allowedOrigins,
      slot_duration: input.slotDuration,
      show_branding: input.showBranding,
    })
    .eq('business_id', businessId)
    .eq('id', widgetId)
    .select('*')
    .single()
  if (error) throw error
  return toWidget(data)
}

export async function deleteWidget(supabase: DbClient, businessId: string, widgetId: string) {
  const { error } = await supabase.from('widgets').delete().eq('business_id', businessId).eq('id', widgetId)
  if (error) throw error
}

export async function incrementWidgetImpressions(supabase: DbClient, widgetId: string) {
  const { error } = await supabase.rpc('increment_widget_counter' as never, {
    widget_id: widgetId,
    column_name: 'impressions',
  } as never)
  if (error) throw error
}

export async function incrementWidgetInteractions(supabase: DbClient, widgetId: string) {
  const { error } = await supabase.rpc('increment_widget_counter' as never, {
    widget_id: widgetId,
    column_name: 'interactions',
  } as never)
  if (error) throw error
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) return true
  return allowedOrigins.includes(origin)
}

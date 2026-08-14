import { z } from 'zod'
import { apiError, json, readJson } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSupabaseAndUser, getBusinessForCurrentUser, getBusinessMembershipRole, canManageBusiness } from '@/lib/route-helpers'
import { getPublicWidgetConfig, getWidgetById, getWidgetForBusiness, createWidget, updateWidget, isOriginAllowed } from '@/services/widgets'
import { widgetSchema } from '@/validations'

const widgetUpsertSchema = widgetSchema.extend({
  widgetId: z.string().uuid().optional(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const businessSlug = url.searchParams.get('businessSlug')
  const widgetSlug = url.searchParams.get('widgetSlug')

  if (businessSlug) {
    const admin = createAdminClient()
    const widget = await getPublicWidgetConfig(admin, businessSlug, widgetSlug)
    if (!widget) {
      return apiError('Widget not found', 404)
    }

    // The embed script (api/widget-script) fetches this cross-origin from
    // whichever site it's pasted into. Enforce the owner's allowlist here
    // (isOriginAllowed treats an empty list as "allow any origin") and echo
    // the origin back so the browser actually lets the embedding page read
    // the response — without this header the fetch silently fails CORS and
    // the widget never receives its real name/colors/greeting.
    const origin = request.headers.get('origin')
    if (origin && !isOriginAllowed(origin, widget.allowedOrigins)) {
      return apiError('This origin is not allowed to load this widget', 403)
    }

    const response = json({ widget })
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Vary', 'Origin')
    }
    return response
  }

  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const widget = await getPublicWidgetConfig(supabase, business.slug, widgetSlug)
  return json({ widget })
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const role = await getBusinessMembershipRole(supabase, business.id, user.id)
  if (!canManageBusiness(role) && business.ownerId !== user.id) {
    return apiError('Forbidden', 403)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = widgetUpsertSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid widget payload', 422, { issues: parsed.error.flatten() })
  }

  const existing = parsed.data.widgetId
    ? await getWidgetById(supabase, business.id, parsed.data.widgetId)
    : await getWidgetForBusiness(supabase, business.id)
  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug || business.slug,
    agentId: parsed.data.agentId ?? null,
    enabled: parsed.data.enabled,
    position: parsed.data.position,
    theme: parsed.data.theme,
    primaryColor: parsed.data.primaryColor,
    secondaryColor: parsed.data.secondaryColor,
    tone: parsed.data.tone,
    greetingMessage: parsed.data.greetingMessage,
    allowedOrigins: parsed.data.allowedOrigins,
    slotDuration: parsed.data.slotDuration,
    showBranding: parsed.data.showBranding,
  }

  const widget = existing
    ? await updateWidget(supabase, business.id, existing.id, payload)
    : await createWidget(supabase, business.id, payload)

  const config = await getPublicWidgetConfig(supabase, business.slug, widget.slug)
  return json({ widget, config }, { status: existing ? 200 : 201 })
}

export async function PATCH(request: Request) {
  return POST(request)
}

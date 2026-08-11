import { z } from 'zod'
import { apiError, json } from '@/lib/api'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicBusinessProfile } from '@/services/business'
import { getPublicWidgetConfig } from '@/services/widgets'
import { getAvailableSlots } from '@/services/appointments'

const slotsQuerySchema = z.object({
  businessSlug: z.string().min(2),
  widgetSlug: z.string().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  fromDate: z.string().datetime().optional(),
  daysAhead: z.coerce.number().int().min(1).max(30).optional(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = slotsQuerySchema.safeParse({
    businessSlug: url.searchParams.get('businessSlug') || '',
    widgetSlug: url.searchParams.get('widgetSlug') || null,
    serviceId: url.searchParams.get('serviceId') || null,
    fromDate: url.searchParams.get('fromDate') || undefined,
    daysAhead: url.searchParams.get('daysAhead') || undefined,
  })

  if (!parsed.success) {
    return apiError('Invalid slot query', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()
  const business = await getPublicBusinessProfile(admin, parsed.data.businessSlug)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const widget = await getPublicWidgetConfig(admin, parsed.data.businessSlug, parsed.data.widgetSlug ?? null)
  if (!widget) {
    return apiError('Widget not found', 404)
  }

  const slots = await getAvailableSlots(admin, business.id, {
    serviceId: parsed.data.serviceId ?? null,
    fromDate: parsed.data.fromDate ? new Date(parsed.data.fromDate) : undefined,
    daysAhead: parsed.data.daysAhead,
  })

  return json({
    business,
    widget,
    slots,
  })
}

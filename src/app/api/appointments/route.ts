import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { createAppointment, getAvailableSlots } from '@/services/appointments'
import { appointmentCreateSchema } from '@/validations'

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = appointmentCreateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid appointment payload', 422, { issues: parsed.error.flatten() })
  }

  // Validate slot availability before creating
  const slots = await getAvailableSlots(supabase, business.id, {
    fromDate: new Date(parsed.data.scheduledAt),
    daysAhead: 1,
    serviceId: parsed.data.serviceId ?? null,
  })

  const slotExists = slots.some((slot) => slot.startAt === parsed.data.scheduledAt)
  if (!slotExists) {
    return apiError('Selected time slot is not available', 409, {
      requestedAt: parsed.data.scheduledAt,
    })
  }

  try {
    const appointment = await createAppointment(supabase, business.id, {
      ...parsed.data,
      source: parsed.data.source ?? 'manual',
    })

    return json({ appointment }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create appointment'
    return apiError(message, 400)
  }
}

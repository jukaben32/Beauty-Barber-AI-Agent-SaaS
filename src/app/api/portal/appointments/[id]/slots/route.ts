import { apiError, json } from '@/lib/api'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalClientForAuthUser } from '@/services/clients'
import { getAppointmentById, getAvailableSlots } from '@/services/appointments'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const client = await getPortalClientForAuthUser(supabase, user.id)
  if (!client) {
    return apiError('No client record linked to this account', 404)
  }

  const admin = createAdminClient()
  const appointment = await getAppointmentById(admin, client.businessId, params.id)
  if (!appointment || appointment.clientId !== client.id) {
    return apiError('Appointment not found', 404)
  }

  const slots = await getAvailableSlots(admin, client.businessId, {
    serviceId: appointment.serviceId,
  })

  return json({ slots })
}

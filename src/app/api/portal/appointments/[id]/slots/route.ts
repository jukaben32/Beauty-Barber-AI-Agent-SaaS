import { apiError, json } from '@/lib/api'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalPatientForAuthUser } from '@/services/patients'
import { getAppointmentById, getAvailableSlots } from '@/services/appointments'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const patient = await getPortalPatientForAuthUser(supabase, user.id)
  if (!patient) {
    return apiError('No patient record linked to this account', 404)
  }

  const admin = createAdminClient()
  const appointment = await getAppointmentById(admin, patient.businessId, params.id)
  if (!appointment || appointment.patientId !== patient.id) {
    return apiError('Appointment not found', 404)
  }

  const slots = await getAvailableSlots(admin, patient.businessId, {
    serviceId: appointment.serviceId,
  })

  return json({ slots })
}

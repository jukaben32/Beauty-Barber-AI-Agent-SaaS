import { apiError, json, readJson } from '@/lib/api'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalPatientForAuthUser } from '@/services/patients'
import { cancelAppointment, getAppointmentById } from '@/services/appointments'
import { getBusinessById } from '@/services/business'
import { createNotification } from '@/services/notifications'
import { buildAppointmentStatusEmail } from '@/lib/email/appointmentStatus'
import { buildBusinessAppointmentEmail } from '@/lib/email/businessNotification'
import { sendEmail } from '@/lib/resend'
import { portalCancelAppointmentSchema } from '@/validations'

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  let body: unknown = {}
  try {
    body = await readJson(request)
  } catch {
    // Empty body is fine - reason is optional.
  }
  const parsed = portalCancelAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  // Ownership check happens here, not via RLS - patients have no direct
  // write access to the appointments table, so this route (running with the
  // admin client) is the only thing standing between "cancel my own
  // appointment" and "cancel anyone's by guessing an ID".
  const appointment = await getAppointmentById(admin, patient.businessId, params.id)
  if (!appointment || appointment.patientId !== patient.id) {
    return apiError('Appointment not found', 404)
  }
  if (appointment.status === 'cancelled') {
    return apiError('Appointment is already cancelled', 400)
  }

  const updated = await cancelAppointment(admin, patient.businessId, params.id, parsed.data.reason ?? null, 'patient')
  const business = await getBusinessById(admin, patient.businessId)
  const serviceName = updated.service?.name || 'Appointment'
  const scheduledAtLabel = new Date(updated.scheduledAt).toLocaleString('en-US')

  await Promise.all([
    patient.email && business
      ? sendEmail({
          to: patient.email,
          subject: `Appointment cancelled - ${business.name}`,
          html: buildAppointmentStatusEmail({
            patientName: patient.name,
            businessName: business.name,
            serviceName,
            scheduledAt: scheduledAtLabel,
            status: 'cancelled',
            reason: parsed.data.reason ?? null,
          }),
        })
      : Promise.resolve(),
    business?.bookingEmail
      ? sendEmail({
          to: business.bookingEmail,
          subject: `Appointment cancelled - ${patient.name}`,
          html: buildBusinessAppointmentEmail({
            businessName: business.name,
            patientName: patient.name,
            patientPhone: patient.phone,
            patientEmail: patient.email,
            serviceName,
            scheduledAt: scheduledAtLabel,
            event: 'cancelled',
            reason: parsed.data.reason ?? null,
          }),
        })
      : Promise.resolve(),
    createNotification(admin, patient.businessId, {
      category: 'appointment',
      title: 'Appointment cancelled by patient',
      message: `${patient.name} cancelled their ${serviceName} appointment.`,
      data: { appointmentId: updated.id },
    }),
  ])

  return json({ appointment: updated })
}

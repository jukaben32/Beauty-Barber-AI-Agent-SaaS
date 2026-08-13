import { apiError, json, readJson } from '@/lib/api'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalClientForAuthUser } from '@/services/clients'
import { getAppointmentById, rescheduleAppointment } from '@/services/appointments'
import { getBusinessById } from '@/services/business'
import { createNotification } from '@/services/notifications'
import { buildAppointmentStatusEmail } from '@/lib/email/appointmentStatus'
import { buildBusinessAppointmentEmail } from '@/lib/email/businessNotification'
import { sendEmail } from '@/lib/resend'
import { portalRescheduleAppointmentSchema } from '@/validations'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }
  const parsed = portalRescheduleAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  const appointment = await getAppointmentById(admin, client.businessId, params.id)
  if (!appointment || appointment.clientId !== client.id) {
    return apiError('Appointment not found', 404)
  }
  if (appointment.status === 'cancelled' || appointment.status === 'completed') {
    return apiError(`Cannot reschedule a ${appointment.status} appointment`, 400)
  }

  let updated
  try {
    updated = await rescheduleAppointment(admin, client.businessId, params.id, parsed.data.scheduledAt)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not reschedule appointment'
    return apiError(message, 409)
  }

  const business = await getBusinessById(admin, client.businessId)
  const serviceName = updated.service?.name || 'Appointment'
  const scheduledAtLabel = new Date(updated.scheduledAt).toLocaleString('en-US')

  await Promise.all([
    // rescheduleAppointment sets status to pending_confirmation - staff still
    // needs to confirm it, same as a brand-new booking, so this reads as a
    // "request received" notice rather than a final confirmation.
    client.email && business
      ? sendEmail({
          to: client.email,
          subject: `Reschedule request received - ${business.name}`,
          html: buildAppointmentStatusEmail({
            clientName: client.name,
            businessName: business.name,
            serviceName,
            scheduledAt: scheduledAtLabel,
            status: 'pending confirmation',
          }),
        })
      : Promise.resolve(),
    business?.bookingEmail
      ? sendEmail({
          to: business.bookingEmail,
          subject: `Reschedule requested - ${client.name}`,
          html: buildBusinessAppointmentEmail({
            businessName: business.name,
            clientName: client.name,
            clientPhone: client.phone,
            clientEmail: client.email,
            serviceName,
            scheduledAt: scheduledAtLabel,
            event: 'reschedule_requested',
          }),
        })
      : Promise.resolve(),
    createNotification(admin, client.businessId, {
      category: 'appointment',
      title: 'Reschedule requested by client',
      message: `${client.name} requested to move their ${serviceName} appointment to ${scheduledAtLabel}.`,
      data: { appointmentId: updated.id },
    }),
  ])

  return json({ appointment: updated })
}

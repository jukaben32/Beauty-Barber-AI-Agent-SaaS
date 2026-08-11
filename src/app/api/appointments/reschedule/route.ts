import { apiError, json, readJson } from '@/lib/api'
import { buildAppointmentStatusEmail } from '@/lib/email/appointmentStatus'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { sendEmail } from '@/lib/resend'
import { rescheduleAppointment } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { appointmentRescheduleSchema } from '@/validations'

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

  const parsed = appointmentRescheduleSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid appointment payload', 422, { issues: parsed.error.flatten() })
  }

  const appointment = await rescheduleAppointment(supabase, business.id, parsed.data.appointmentId, parsed.data.scheduledAt)

  if (appointment.client?.email) {
    await sendEmail({
      to: appointment.client.email,
      subject: `Appointment rescheduled - ${business.name}`,
      html: buildAppointmentStatusEmail({
        clientName: appointment.client.name,
        businessName: business.name,
        serviceName: appointment.service?.name || 'Appointment',
        scheduledAt: new Date(appointment.scheduledAt).toLocaleString('en-US'),
        status: 'pending_confirmation',
      }),
    })
  }

  await createNotification(supabase, business.id, {
    category: 'appointment',
    title: 'Appointment rescheduled',
    message: `Appointment ${appointment.id} was rescheduled.`,
    data: { appointmentId: appointment.id, scheduledAt: appointment.scheduledAt },
  })

  return json({ appointment })
}

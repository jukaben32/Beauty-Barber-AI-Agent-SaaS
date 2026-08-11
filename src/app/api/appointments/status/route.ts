import { apiError, json, readJson } from '@/lib/api'
import { buildAppointmentStatusEmail } from '@/lib/email/appointmentStatus'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { sendEmail } from '@/lib/resend'
import { updateAppointmentStatus } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { appointmentStatusSchema } from '@/validations'
import { toTitleCase } from '@/lib/utils'

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

  const parsed = appointmentStatusSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid appointment payload', 422, { issues: parsed.error.flatten() })
  }

  const appointment = await updateAppointmentStatus(supabase, business.id, parsed.data.appointmentId, parsed.data.status, {
    cancellationReason: parsed.data.cancellationReason ?? null,
    cancelledBy: parsed.data.cancelledBy ?? 'business',
  })

  if (appointment.client?.email) {
    await sendEmail({
      to: appointment.client.email,
      subject: `Appointment ${toTitleCase(parsed.data.status)} - ${business.name}`,
      html: buildAppointmentStatusEmail({
        clientName: appointment.client.name,
        businessName: business.name,
        serviceName: appointment.service?.name || 'Appointment',
        scheduledAt: new Date(appointment.scheduledAt).toLocaleString('en-US'),
        status: parsed.data.status,
        reason: parsed.data.cancellationReason ?? null,
      }),
    })
  }

  await createNotification(supabase, business.id, {
    category: 'appointment',
    title: `Appointment ${toTitleCase(parsed.data.status)}`,
    message: `Appointment ${appointment.id} changed to ${parsed.data.status}.`,
    data: { appointmentId: appointment.id, status: parsed.data.status },
  })

  return json({ appointment })
}

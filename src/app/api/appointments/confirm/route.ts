import { z } from 'zod'
import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { confirmAppointment } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { buildAppointmentStatusEmail } from '@/lib/email/appointmentStatus'
import { sendEmail } from '@/lib/resend'

const confirmSchema = z.object({
  appointmentId: z.string().uuid(),
})

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid appointment payload', 422, { issues: parsed.error.flatten() })
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const appointment = await confirmAppointment(supabase, business.id, parsed.data.appointmentId)

  if (appointment.patient?.email) {
    await sendEmail({
      to: appointment.patient.email,
      subject: `Appointment confirmed - ${business.name}`,
      html: buildAppointmentStatusEmail({
        patientName: appointment.patient.name,
        businessName: business.name,
        serviceName: appointment.service?.name || 'Appointment',
        scheduledAt: new Date(appointment.scheduledAt).toLocaleString('en-US'),
        status: 'confirmed',
      }),
    })
  }

  await createNotification(supabase, business.id, {
    category: 'appointment',
    title: 'Appointment confirmed',
    message: `Appointment ${appointment.id} was confirmed.`,
    data: { appointmentId: appointment.id, status: appointment.status },
  })

  return json({ appointment })
}

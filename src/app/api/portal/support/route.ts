import { apiError, json, readJson } from '@/lib/api'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalPatientForAuthUser } from '@/services/patients'
import { getAppointmentById } from '@/services/appointments'
import { createSupportTicket, listSupportTickets } from '@/services/support'
import { getBusinessById } from '@/services/business'
import { createNotification } from '@/services/notifications'
import { sendEmail } from '@/lib/resend'
import { emailShell, escapeHtml } from '@/lib/email/shared'
import { portalSupportTicketSchema } from '@/validations'

export async function GET() {
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
  const tickets = await listSupportTickets(admin, patient.businessId, { patientId: patient.id })

  return json({ tickets })
}

export async function POST(request: Request) {
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

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }
  const parsed = portalSupportTicketSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  // Ownership check for the optional linked appointment, same reasoning as
  // the cancel/reschedule routes: patients have no RLS access to arbitrary
  // appointments, so this route (admin client) is what stops a patient
  // from attaching someone else's appointment to their ticket.
  if (parsed.data.appointmentId) {
    const appointment = await getAppointmentById(admin, patient.businessId, parsed.data.appointmentId)
    if (!appointment || appointment.patientId !== patient.id) {
      return apiError('Appointment not found', 404)
    }
  }

  const ticket = await createSupportTicket(admin, patient.businessId, {
    patientId: patient.id,
    appointmentId: parsed.data.appointmentId ?? null,
    subject: parsed.data.subject,
    description: parsed.data.description ?? null,
  })

  const business = await getBusinessById(admin, patient.businessId)

  await Promise.all([
    business?.bookingEmail
      ? sendEmail({
          to: business.bookingEmail,
          subject: `New support ticket - ${patient.name}`,
          html: emailShell(
            'New support ticket',
            `<p>Hello ${escapeHtml(business.name)} team,</p>
             <p><strong>${escapeHtml(patient.name)}</strong> opened a support ticket: <strong>${escapeHtml(parsed.data.subject)}</strong></p>
             ${parsed.data.description ? `<p>${escapeHtml(parsed.data.description)}</p>` : ''}
             <p>Open the dashboard to reply.</p>`
          ),
        })
      : Promise.resolve(),
    createNotification(admin, patient.businessId, {
      category: 'support',
      title: 'New support ticket',
      message: `${patient.name} opened a ticket: ${parsed.data.subject}`,
      data: { ticketId: ticket.id },
    }),
  ])

  return json({ ticket })
}

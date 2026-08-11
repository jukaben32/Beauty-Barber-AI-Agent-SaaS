import { emailShell, escapeHtml } from './shared'

// For the business/staff side: sent when a patient or the AI voice agent
// creates, cancels, or reschedules an appointment - the staff-initiated
// routes (confirm/status/reschedule under /api/appointments) already email
// the patient directly and don't need this, since staff already know what
// they just did.
export function buildBusinessAppointmentEmail(opts: {
  businessName: string
  patientName: string
  patientPhone?: string | null
  patientEmail?: string | null
  serviceName: string
  scheduledAt: string
  event: 'booked' | 'cancelled' | 'reschedule_requested'
  reason?: string | null
}) {
  const eventLabel: Record<typeof opts.event, string> = {
    booked: 'New appointment booked',
    cancelled: 'Appointment cancelled by patient',
    reschedule_requested: 'Reschedule requested by patient',
  }

  const body = `
    <p>Hello ${escapeHtml(opts.businessName)} team,</p>
    <p><strong>${escapeHtml(eventLabel[opts.event])}</strong> - here are the details.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:8px 0;color:#64748b;">Patient</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.patientName)}</strong></td></tr>
      ${opts.patientPhone ? `<tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.patientPhone)}</strong></td></tr>` : ''}
      ${opts.patientEmail ? `<tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.patientEmail)}</strong></td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#64748b;">Service</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.serviceName)}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Date and time</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.scheduledAt)}</strong></td></tr>
      ${opts.reason ? `<tr><td style="padding:8px 0;color:#64748b;">Reason</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.reason)}</strong></td></tr>` : ''}
    </table>
    <p>Open the dashboard to review or confirm.</p>
  `

  return emailShell(eventLabel[opts.event], body)
}

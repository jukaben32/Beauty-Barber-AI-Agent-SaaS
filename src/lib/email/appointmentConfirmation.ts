import { emailShell, escapeHtml } from './shared'

export function buildAppointmentConfirmationEmail(opts: {
  patientName: string
  businessName: string
  serviceName: string
  scheduledAt: string
  portalUrl?: string | null
}) {
  const body = `
    <p>Hello ${escapeHtml(opts.patientName)},</p>
    <p>Your appointment was booked successfully with <strong>${escapeHtml(opts.businessName)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:8px 0;color:#64748b;">Service</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.serviceName)}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Date and time</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.scheduledAt)}</strong></td></tr>
    </table>
    ${opts.portalUrl ? `<p>You can review your appointment from the portal: <a href="${escapeHtml(opts.portalUrl)}">${escapeHtml(opts.portalUrl)}</a></p>` : ''}
    <p>If you need to reschedule or cancel, reply to this email or open the patient portal.</p>
  `

  return emailShell('Appointment confirmation', body)
}

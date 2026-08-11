import { emailShell, escapeHtml } from './shared'

export function buildAppointmentStatusEmail(opts: {
  clientName: string
  businessName: string
  serviceName: string
  scheduledAt: string
  status: string
  reason?: string | null
}) {
  const body = `
    <p>Hello ${escapeHtml(opts.clientName)},</p>
    <p>Your appointment at <strong>${escapeHtml(opts.businessName)}</strong> changed to <strong>${escapeHtml(opts.status)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:8px 0;color:#64748b;">Service</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.serviceName)}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Date and time</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.scheduledAt)}</strong></td></tr>
      ${opts.reason ? `<tr><td style="padding:8px 0;color:#64748b;">Reason</td><td style="padding:8px 0;"><strong>${escapeHtml(opts.reason)}</strong></td></tr>` : ''}
    </table>
  `

  return emailShell('Appointment update', body)
}

import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'Clara <noreply@example.com>'
}

export async function sendEmail(options: { to: string | string[]; subject: string; html: string; text?: string }) {
  const client = getResendClient()
  if (!client) {
    return { skipped: true as const }
  }

  const response = await client.emails.send({
    from: getFromEmail(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })

  return { skipped: false as const, response }
}

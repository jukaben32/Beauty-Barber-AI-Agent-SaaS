import { apiError, json, readJson } from '@/lib/api'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPortalClientForAuthUser } from '@/services/clients'
import { appendSupportMessage, getSupportTicket, listSupportMessages } from '@/services/support'
import { createNotification } from '@/services/notifications'
import { portalSupportMessageSchema } from '@/validations'

async function loadOwnedTicket(admin: ReturnType<typeof createAdminClient>, businessId: string, clientId: string, ticketId: string) {
  const ticket = await getSupportTicket(admin, businessId, ticketId)
  if (!ticket || ticket.clientId !== clientId) {
    return null
  }
  return ticket
}

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
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

  const admin = createAdminClient()
  const ticket = await loadOwnedTicket(admin, client.businessId, client.id, params.id)
  if (!ticket) {
    return apiError('Ticket not found', 404)
  }

  const messages = await listSupportMessages(admin, client.businessId, params.id)
  return json({ ticket, messages })
}

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
  const parsed = portalSupportMessageSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()
  const ticket = await loadOwnedTicket(admin, client.businessId, client.id, params.id)
  if (!ticket) {
    return apiError('Ticket not found', 404)
  }
  if (ticket.status === 'closed') {
    return apiError('This ticket is closed', 400)
  }

  const message = await appendSupportMessage(admin, client.businessId, params.id, {
    senderType: 'client',
    content: parsed.data.content,
  })

  await createNotification(admin, client.businessId, {
    category: 'support',
    title: 'New reply on support ticket',
    message: `${client.name} replied to "${ticket.subject}".`,
    data: { ticketId: ticket.id },
  })

  return json({ message })
}

import { z } from 'zod'

import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { getWhatsappConnection, refreshWhatsappStatus, toPublicWhatsappConnection, updateWhatsappConnection } from '@/services/whatsapp'

const updateSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  isEnabled: z.boolean().optional(),
})

export async function GET() {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  let connection = await getWhatsappConnection(supabase, business.id)
  if (connection && connection.status !== 'connected') {
    try {
      connection = await refreshWhatsappStatus(supabase, connection)
    } catch {
      // Keep the last known state if Evolution API is not reachable.
    }
  }

  return json({ connection: connection ? toPublicWhatsappConnection(connection) : null })
}

export async function PATCH(request: Request) {
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

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid WhatsApp payload', 422, { issues: parsed.error.flatten() })
  }

  try {
    const connection = await updateWhatsappConnection(supabase, business.id, {
      agentId: parsed.data.agentId ?? undefined,
      isEnabled: parsed.data.isEnabled,
    })
    return json({ connection: toPublicWhatsappConnection(connection) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update WhatsApp connection'
    return apiError(message, 400)
  }
}

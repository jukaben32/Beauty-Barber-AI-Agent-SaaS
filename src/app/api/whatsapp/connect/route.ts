import { z } from 'zod'

import { apiError, json, readJson } from '@/lib/api'
import { EvolutionApiNotConfiguredError } from '@/lib/evolutionApi'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { connectWhatsapp, toPublicWhatsappConnection } from '@/services/whatsapp'

const connectSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
})

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
    body = {}
  }

  const parsed = connectSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid WhatsApp payload', 422, { issues: parsed.error.flatten() })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

  try {
    const { connection, qrCode } = await connectWhatsapp(supabase, business.id, parsed.data.agentId ?? null, appUrl)
    return json({ connection: toPublicWhatsappConnection(connection), qrCode })
  } catch (error) {
    if (error instanceof EvolutionApiNotConfiguredError) {
      return apiError(error.message, 503, { notConfigured: true })
    }

    const message = error instanceof Error ? error.message : 'Could not connect WhatsApp'
    return apiError(message, 502)
  }
}

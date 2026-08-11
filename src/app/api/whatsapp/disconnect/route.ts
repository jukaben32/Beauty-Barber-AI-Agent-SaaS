import { apiError, json } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { disconnectWhatsapp, getWhatsappConnection } from '@/services/whatsapp'

export async function POST() {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const connection = await getWhatsappConnection(supabase, business.id)
  if (!connection) {
    return json({ ok: true })
  }

  try {
    await disconnectWhatsapp(supabase, connection)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not disconnect WhatsApp'
    return apiError(message, 502)
  }

  return json({ ok: true })
}

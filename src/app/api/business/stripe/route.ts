import { apiError, json, readJson } from '@/lib/api'
import { canManageBusiness, getBusinessForCurrentUser, getBusinessMembershipRole, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret } from '@/lib/cryptoSecrets'
import { disconnectStripeAccount, getStripeAccountStatus, saveStripeAccount } from '@/services/stripeAccounts'
import { stripeAccountSchema } from '@/validations'

export async function GET() {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const status = await getStripeAccountStatus(supabase, business.id)
  return json({ stripe: status })
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const role = await getBusinessMembershipRole(supabase, business.id, user.id)
  if (!canManageBusiness(role) && business.ownerId !== user.id) {
    return apiError('Only the business owner or an admin can update payment settings', 403)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = stripeAccountSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid Stripe keys', 422, { issues: parsed.error.flatten() })
  }

  try {
    // encryptSecret needs the service-role admin client's environment and
    // must never run where a browser could reach it - this route only.
    const secretKeyEncrypted = encryptSecret(parsed.data.secretKey)
    const admin = createAdminClient()
    const status = await saveStripeAccount(admin, business.id, {
      publishableKey: parsed.data.publishableKey,
      secretKeyEncrypted,
    })
    return json({ stripe: status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save Stripe keys'
    return apiError(message, 500)
  }
}

export async function DELETE() {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const role = await getBusinessMembershipRole(supabase, business.id, user.id)
  if (!canManageBusiness(role) && business.ownerId !== user.id) {
    return apiError('Only the business owner or an admin can update payment settings', 403)
  }

  const admin = createAdminClient()
  await disconnectStripeAccount(admin, business.id)
  return json({ stripe: { connected: false, publishableKey: null, connectedAt: null } })
}

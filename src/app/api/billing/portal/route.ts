import { apiError, json } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { getSubscription } from '@/services/business'
import { createBillingPortalSession } from '@/services/subscriptionBilling'

export async function POST() {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) return apiError('Not authenticated', 401)

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) return apiError('No business found for this user', 404)

  const subscription = await getSubscription(supabase, business.id)
  if (!subscription?.stripeCustomerId) {
    return apiError('No billing account yet — subscribe to a plan first', 400)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const session = await createBillingPortalSession({
      stripeCustomerId: subscription.stripeCustomerId,
      returnUrl: `${appUrl}/dashboard/billing`,
    })
    return json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open billing portal'
    return apiError(message, 500)
  }
}

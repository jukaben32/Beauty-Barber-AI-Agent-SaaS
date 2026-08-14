import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { createCheckoutSession, createWebsiteBuilderCheckoutSession } from '@/services/subscriptionBilling'
import type { PlanId } from '@/types'

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) return apiError('Not authenticated', 401)

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) return apiError('No business found for this user', 404)

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }
  const { plan, addon } = (body ?? {}) as { plan?: Exclude<PlanId, 'free'>; addon?: string }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session =
      addon === 'website_builder'
        ? await createWebsiteBuilderCheckoutSession({
            businessId: business.id,
            ownerEmail: user.email!,
            successUrl: `${appUrl}/dashboard/website?checkout=success`,
            cancelUrl: `${appUrl}/dashboard/website?checkout=cancelled`,
          })
        : await createCheckoutSession({
            businessId: business.id,
            ownerEmail: user.email!,
            plan: plan as Exclude<PlanId, 'free'>,
            successUrl: `${appUrl}/dashboard/billing?checkout=success`,
            cancelUrl: `${appUrl}/dashboard/billing?checkout=cancelled`,
          })

    return json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start checkout'
    return apiError(message, 500)
  }
}

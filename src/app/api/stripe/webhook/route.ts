import { apiError, json } from '@/lib/api'
import { getStripeClient, syncSubscriptionFromStripeEvent } from '@/services/subscriptionBilling'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return apiError('Missing signature', 400)

  const stripe = getStripeClient()
  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return apiError(`Webhook signature verification failed: ${message}`, 400)
  }

  const supabase = createAdminClient()
  await syncSubscriptionFromStripeEvent(supabase, event)

  return json({ received: true })
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser, getBusinessAvailability, getClosedDates } from '@/services/business'
import { getStripeAccountStatus } from '@/services/stripeAccounts'
import { SettingsManager } from '@/components/clinic/SettingsManager'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [availability, closedDates, stripeStatus] = await Promise.all([
    getBusinessAvailability(supabase, business.id),
    getClosedDates(supabase, business.id),
    getStripeAccountStatus(supabase, business.id),
  ])

  return (
    <SettingsManager
      business={business}
      initialAvailability={availability}
      initialClosedDates={closedDates}
      initialStripeStatus={stripeStatus}
    />
  )
}

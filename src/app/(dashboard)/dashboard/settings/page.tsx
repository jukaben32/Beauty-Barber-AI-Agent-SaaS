import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser, getBusinessAvailability, getClosedDates } from '@/services/business'
import { SettingsManager } from '@/components/dashboard/SettingsManager'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [availability, closedDates] = await Promise.all([
    getBusinessAvailability(supabase, business.id),
    getClosedDates(supabase, business.id),
  ])

  return (
    <SettingsManager
      business={business}
      initialAvailability={availability}
      initialClosedDates={closedDates}
    />
  )
}

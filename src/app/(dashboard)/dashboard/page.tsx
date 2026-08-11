import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser, getDashboardAnalytics } from '@/services/business'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { listConversationsForBusiness } from '@/services/conversations'
import { DashboardOverviewManager } from '@/components/clinic/DashboardOverviewManager'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [analytics, appointments, conversations] = await Promise.all([
    getDashboardAnalytics(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id, { limit: 50 }),
    listConversationsForBusiness(supabase, business.id, 300),
  ])

  return (
    <DashboardOverviewManager
      businessName={business.name}
      businessSlug={business.slug}
      timezone={business.timezone}
      analytics={analytics}
      conversations={conversations}
      appointments={appointments}
    />
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser, getDashboardAnalytics } from '@/services/business'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { listConversationsForBusiness } from '@/services/conversations'
import { getAiSpendUsd } from '@/services/aiUsage'
import { AnalyticsManager } from '@/components/dashboard/AnalyticsManager'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [analytics, appointments, conversations, aiSpendUsd] = await Promise.all([
    getDashboardAnalytics(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id, { limit: 300 }),
    listConversationsForBusiness(supabase, business.id, 200),
    getAiSpendUsd(supabase, business.id),
  ])

  return (
    <AnalyticsManager
      analytics={analytics}
      appointments={appointments}
      conversations={conversations}
      timezone={business.timezone}
      businessName={business.name}
      aiSpendUsd={aiSpendUsd}
    />
  )
}

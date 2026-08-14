import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser, getSubscription } from '@/services/business'
import { listAgentsForBusiness } from '@/services/agents'
import { listServices } from '@/services/services'
import { AgentsManager } from '@/components/dashboard/AgentsManager'
import { PLAN_LIMITS } from '@/constants'

export default async function AgentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [agents, services, subscription] = await Promise.all([
    listAgentsForBusiness(supabase, business.id),
    listServices(supabase, business.id),
    getSubscription(supabase, business.id),
  ])

  const agentLimit = PLAN_LIMITS[subscription?.plan ?? 'free'].agentLimit

  return (
    <AgentsManager
      initialAgents={agents}
      businessId={business.id}
      services={services}
      agentLimit={agentLimit}
    />
  )
}

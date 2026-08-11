import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { getAgentById } from '@/services/agents'
import { listClinicServices } from '@/services/services'
import { AgentDetailManager } from '@/components/clinic/AgentDetailManager'

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { mode?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [agent, services] = await Promise.all([
    getAgentById(supabase, business.id, params.id),
    listClinicServices(supabase, business.id),
  ])
  if (!agent) notFound()

  return (
    <AgentDetailManager
      agent={agent}
      businessId={business.id}
      businessSlug={business.slug}
      services={services}
      initialMode={searchParams?.mode === 'test-live' ? 'test-live' : 'configure'}
    />
  )
}

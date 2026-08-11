import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { getBusinessForUser } from '@/services/business'
import { listAgentsForBusiness } from '@/services/agents'
import { createWidget, listWidgetsForBusiness } from '@/services/widgets'
import { WidgetManager } from '@/components/dashboard/WidgetManager'

export default async function WidgetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [agents, widgets] = await Promise.all([
    listAgentsForBusiness(supabase, business.id),
    listWidgetsForBusiness(supabase, business.id),
  ])

  let initialWidgets = widgets
  if (initialWidgets.length === 0) {
    const defaultAgent = agents.find((agent) => agent.status === 'live') ?? agents[0] ?? null
    const created = await createWidget(supabase, business.id, {
      name: `${defaultAgent?.name ?? business.name} Widget`,
      slug: slugify(`${business.slug}-widget`) || `${business.slug}-widget`,
      agentId: defaultAgent?.id ?? null,
      enabled: true,
      position: 'bottom-right',
      theme: 'light',
    })

    initialWidgets = [
      {
        ...created,
        agentName: defaultAgent?.name ?? null,
      },
    ]
  }

  const headerStore = headers()
  const forwardedProto = headerStore.get('x-forwarded-proto') ?? 'https'
  const forwardedHost = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const siteOrigin = process.env.NEXT_PUBLIC_APP_URL || (forwardedHost ? `${forwardedProto}://${forwardedHost}` : 'http://localhost:3000')

  return (
    <WidgetManager
      businessId={business.id}
      businessName={business.name}
      businessSlug={business.slug}
      siteOrigin={siteOrigin}
      initialWidgets={initialWidgets}
      agents={agents}
    />
  )
}

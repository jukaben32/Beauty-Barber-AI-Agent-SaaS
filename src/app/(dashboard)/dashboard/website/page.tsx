import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listAgentsForBusiness } from '@/services/agents'
import { getOrCreateWebsiteForBusiness, getWebsiteContentForBusiness } from '@/services/websites'
import { WebsiteEditor } from '@/components/website/WebsiteEditor'

export default async function WebsitePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  await getOrCreateWebsiteForBusiness(supabase, business)

  const [content, agents] = await Promise.all([
    getWebsiteContentForBusiness(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
  ])

  return <WebsiteEditor initialContent={content} agents={agents} businessName={business.name} />
}

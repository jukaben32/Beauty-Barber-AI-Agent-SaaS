import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listConversationsForBusiness } from '@/services/conversations'
import { listClientsForBusiness } from '@/services/clients'
import { ConversationsManager } from '@/components/dashboard/ConversationsManager'

export default async function ConversationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [conversations, clients] = await Promise.all([
    listConversationsForBusiness(supabase, business.id, 50),
    listClientsForBusiness(supabase, business.id),
  ])

  return (
    <ConversationsManager
      initialConversations={conversations}
      clients={clients}
      timezone={business.timezone}
      businessName={business.name}
    />
  )
}

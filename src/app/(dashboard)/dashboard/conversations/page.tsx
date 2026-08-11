import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listConversationsForBusiness } from '@/services/conversations'
import { listPatientsForBusiness } from '@/services/patients'
import { ConversationsManager } from '@/components/clinic/ConversationsManager'

export default async function ConversationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [conversations, patients] = await Promise.all([
    listConversationsForBusiness(supabase, business.id, 50),
    listPatientsForBusiness(supabase, business.id),
  ])

  return (
    <ConversationsManager
      initialConversations={conversations}
      patients={patients}
      timezone={business.timezone}
      businessName={business.name}
    />
  )
}

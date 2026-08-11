import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listSupportTickets } from '@/services/support'
import { SupportManager } from '@/components/dashboard/SupportManager'

export default async function SupportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const tickets = await listSupportTickets(supabase, business.id, 50)

  return <SupportManager initialTickets={tickets} businessId={business.id} timezone={business.timezone} businessName={business.name} />
}

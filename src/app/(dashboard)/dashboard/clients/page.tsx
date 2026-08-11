import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listBillingTransactions } from '@/services/billing'
import { listClientsForBusiness } from '@/services/clients'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { ClientsManager } from '@/components/dashboard/ClientsManager'

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [clients, appointments, billingTransactions] = await Promise.all([
    listClientsForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id, { limit: 200 }),
    listBillingTransactions(supabase, business.id, 500),
  ])

  return (
    <ClientsManager
      initialClients={clients}
      appointments={appointments}
      billingTransactions={billingTransactions}
      timezone={business.timezone}
      businessName={business.name}
      paymentCurrency={business.paymentCurrency}
    />
  )
}

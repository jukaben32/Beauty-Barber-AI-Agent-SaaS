import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listBillingTransactions } from '@/services/billing'
import { listPatientsForBusiness } from '@/services/patients'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { PatientsManager } from '@/components/clinic/PatientsManager'

export default async function PatientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [patients, appointments, billingTransactions] = await Promise.all([
    listPatientsForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id, { limit: 200 }),
    listBillingTransactions(supabase, business.id, 500),
  ])

  return (
    <PatientsManager
      initialPatients={patients}
      appointments={appointments}
      billingTransactions={billingTransactions}
      timezone={business.timezone}
      businessName={business.name}
      paymentCurrency={business.paymentCurrency}
    />
  )
}

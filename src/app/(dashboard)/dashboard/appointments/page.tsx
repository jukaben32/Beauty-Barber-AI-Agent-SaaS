import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { AppointmentsManager } from '@/components/dashboard/AppointmentsManager'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const appointments = await listAppointmentsForBusiness(supabase, business.id, { limit: 100 })

  return <AppointmentsManager initialAppointments={appointments} timezone={business.timezone} businessName={business.name} />
}

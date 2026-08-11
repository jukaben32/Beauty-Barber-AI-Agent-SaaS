import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listClinicServices } from '@/services/services'
import { ServicesManager } from '@/components/clinic/ServicesManager'

export default async function ServicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const services = await listClinicServices(supabase, business.id)

  return <ServicesManager initialServices={services} businessId={business.id} />
}

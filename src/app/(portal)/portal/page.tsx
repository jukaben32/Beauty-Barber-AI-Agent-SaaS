import { redirect } from 'next/navigation'
import { getPortalContext } from '@/lib/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPatientAppointmentsForPortal } from '@/services/appointments'
import { PortalTopBar } from '@/components/portal/PortalTopBar'
import { PortalHomeManager } from '@/components/portal/PortalHomeManager'

export default async function Page() {
  const { user, patient, business } = await getPortalContext()
  if (!user) redirect('/portal/login')
  if (!patient || !business) redirect('/portal/register')

  const admin = createAdminClient()
  const appointments = await getPatientAppointmentsForPortal(admin, user.id)

  return (
    <>
      <PortalTopBar businessName={business.name} />
      <div className="px-4 pb-10 lg:px-8">
        <PortalHomeManager patient={patient} businessName={business.name} timezone={business.timezone} appointments={appointments} />
      </div>
    </>
  )
}

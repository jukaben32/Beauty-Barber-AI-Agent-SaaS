import { redirect } from 'next/navigation'
import { getPortalContext } from '@/lib/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { listSupportTickets } from '@/services/support'
import { PortalTopBar } from '@/components/portal/PortalTopBar'
import { PortalSupportManager } from '@/components/portal/PortalSupportManager'

export default async function Page() {
  const { user, client, business } = await getPortalContext()
  if (!user) redirect('/portal/login')
  if (!client || !business) redirect('/portal/register')

  const admin = createAdminClient()
  const tickets = await listSupportTickets(admin, client.businessId, { clientId: client.id })

  return (
    <>
      <PortalTopBar businessName={business.name} />
      <div className="px-4 pb-10 lg:px-8">
        <PortalSupportManager initialTickets={tickets} timezone={business.timezone} />
      </div>
    </>
  )
}

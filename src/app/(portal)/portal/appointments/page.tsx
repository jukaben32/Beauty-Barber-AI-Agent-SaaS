import { redirect } from 'next/navigation'
import { getPortalContext } from '@/lib/route-helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientAppointmentsForPortal } from '@/services/appointments'
import { PortalTopBar } from '@/components/portal/PortalTopBar'
import { PortalAppointmentsManager } from '@/components/portal/PortalAppointmentsManager'

export default async function Page() {
  const { user, client, business } = await getPortalContext()
  if (!user) redirect('/portal/login')
  if (!client || !business) redirect('/portal/register')

  const admin = createAdminClient()
  const appointments = await getClientAppointmentsForPortal(admin, user.id)

  return (
    <>
      <PortalTopBar businessName={business.name} />
      <div className="px-4 pb-10 lg:px-8">
        <PortalAppointmentsManager
          initialAppointments={appointments}
          timezone={business.timezone}
          paymentCurrency={business.paymentCurrency}
          acceptsCash={business.acceptsCash}
          acceptsTransfer={business.acceptsTransfer}
          bankDetails={{
            bankName: business.bankName,
            bankAccountHolder: business.bankAccountHolder,
            bankAccountNumber: business.bankAccountNumber,
            bankAccountType: business.bankAccountType,
          }}
        />
      </div>
    </>
  )
}

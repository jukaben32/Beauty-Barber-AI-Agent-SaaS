import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser, getSubscription } from '@/services/business'
import { getPaymentConfigForBusiness, listBillingTransactions, getBillingSummary } from '@/services/billing'
import { BillingManager } from '@/components/clinic/BillingManager'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [subscription, paymentConfig, transactions, summary] = await Promise.all([
    getSubscription(supabase, business.id),
    getPaymentConfigForBusiness(supabase, business.id),
    listBillingTransactions(supabase, business.id, 50),
    getBillingSummary(supabase, business.id),
  ])

  return (
    <BillingManager
      subscription={subscription}
      paymentConfig={paymentConfig}
      transactions={transactions}
      summary={summary}
    />
  )
}

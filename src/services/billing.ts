import type { BillingTransaction } from '@/types'
import type { DbClient } from './_shared'

function toBilling(row: any): BillingTransaction {
  return {
    id: row.id,
    businessId: row.business_id,
    appointmentId: row.appointment_id ?? null,
    clientId: row.client_id ?? null,
    amount: row.amount,
    currency: row.currency,
    chainId: row.chain_id,
    txHash: row.tx_hash,
    status: row.status,
    paymentType: row.payment_type,
    metadata: row.metadata ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPaymentConfigForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('payment_wallet_address, payment_chain_id, payment_currency, booking_deposit_amount')
    .eq('id', businessId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function listBillingTransactions(supabase: DbClient, businessId: string, limit = 50) {
  const { data, error } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(toBilling)
}

export async function listBillingTransactionsForAppointment(
  supabase: DbClient,
  businessId: string,
  appointmentId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('business_id', businessId)
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(toBilling)
}

export async function recordBillingTransaction(
  supabase: DbClient,
  businessId: string,
  input: {
    appointmentId?: string | null
    clientId?: string | null
    amount: number
    currency: string
    chainId: number
    txHash: string
    status?: BillingTransaction['status']
    paymentType?: BillingTransaction['paymentType']
    metadata?: Record<string, unknown> | null
  }
) {
  const { data, error } = await supabase
    .from('billing_transactions')
    .insert({
      business_id: businessId,
      appointment_id: input.appointmentId ?? null,
      client_id: input.clientId ?? null,
      amount: input.amount,
      currency: input.currency,
      chain_id: input.chainId,
      tx_hash: input.txHash,
      status: input.status ?? 'pending',
      payment_type: input.paymentType ?? 'booking_deposit',
      metadata: input.metadata ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return toBilling(data)
}

export async function updateBillingTransactionStatus(
  supabase: DbClient,
  businessId: string,
  txHash: string,
  status: BillingTransaction['status']
) {
  const { data, error } = await supabase
    .from('billing_transactions')
    .update({ status })
    .eq('business_id', businessId)
    .eq('tx_hash', txHash)
    .select('*')
    .single()
  if (error) throw error
  return toBilling(data)
}

export async function getBillingSummary(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('billing_transactions').select('status, amount, payment_type').eq('business_id', businessId)
  if (error) throw error
  const rows = data ?? []
  const total = rows.reduce((sum, row: any) => sum + Number(row.amount || 0), 0)
  const confirmed = rows.filter((row: any) => row.status === 'confirmed').reduce((sum, row: any) => sum + Number(row.amount || 0), 0)
  const pending = rows.filter((row: any) => row.status === 'pending').length
  return {
    total,
    confirmed,
    pending,
    count: rows.length,
  }
}

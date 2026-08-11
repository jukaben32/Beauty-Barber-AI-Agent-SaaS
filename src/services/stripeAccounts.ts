import type { DbClient } from './_shared'

export interface StripeAccountStatus {
  connected: boolean
  publishableKey: string | null
  connectedAt: string | null
}

// Never selects/returns secret_key_encrypted - callers that need the actual
// secret (to charge a card, once that flow exists) should read it directly
// with the admin client and decryptSecret(), server-side only.
export async function getStripeAccountStatus(supabase: DbClient, businessId: string): Promise<StripeAccountStatus> {
  const { data, error } = await supabase
    .from('business_stripe_accounts')
    .select('publishable_key, connected_at')
    .eq('business_id', businessId)
    .maybeSingle()
  if (error) throw error
  return {
    connected: Boolean(data?.connected_at),
    publishableKey: data?.publishable_key ?? null,
    connectedAt: data?.connected_at ?? null,
  }
}

export async function saveStripeAccount(
  supabase: DbClient,
  businessId: string,
  input: { publishableKey: string; secretKeyEncrypted: string }
): Promise<StripeAccountStatus> {
  const { data, error } = await supabase
    .from('business_stripe_accounts')
    .upsert(
      {
        business_id: businessId,
        publishable_key: input.publishableKey,
        secret_key_encrypted: input.secretKeyEncrypted,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    )
    .select('publishable_key, connected_at')
    .single()
  if (error) throw error
  return {
    connected: Boolean(data.connected_at),
    publishableKey: data.publishable_key,
    connectedAt: data.connected_at,
  }
}

export async function disconnectStripeAccount(supabase: DbClient, businessId: string): Promise<void> {
  const { error } = await supabase.from('business_stripe_accounts').delete().eq('business_id', businessId)
  if (error) throw error
}

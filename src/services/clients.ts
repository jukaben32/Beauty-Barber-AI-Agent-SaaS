import type { Client } from '@/types'
import type { DbClient } from './_shared'

export function toClient(row: any): Client {
  return {
    id: row.id,
    businessId: row.business_id,
    authUserId: row.auth_user_id ?? null,
    name: row.name,
    phone: row.phone ?? null,
    email: row.email ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    notes: row.notes ?? null,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listClientsForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toClient)
}

export async function searchClients(supabase: DbClient, businessId: string, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return listClientsForBusiness(supabase, businessId)

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toClient)
}

export async function getClientById(supabase: DbClient, businessId: string, clientId: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('business_id', businessId).eq('id', clientId).maybeSingle()
  if (error) throw error
  return data ? toClient(data) : null
}

export async function getClientByEmail(supabase: DbClient, businessId: string, email: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .ilike('email', email)
    .maybeSingle()
  if (error) throw error
  return data ? toClient(data) : null
}

export async function getClientByPhone(supabase: DbClient, businessId: string, phone: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .maybeSingle()
  if (error) throw error
  return data ? toClient(data) : null
}

export async function createClient(
  supabase: DbClient,
  businessId: string,
  input: {
    name: string
    email?: string | null
    phone?: string | null
    dateOfBirth?: string | null
    notes?: string | null
    source?: Client['source']
    authUserId?: string | null
  }
) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      business_id: businessId,
      auth_user_id: input.authUserId ?? null,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      notes: input.notes ?? null,
      source: input.source ?? 'manual',
    })
    .select('*')
    .single()
  if (error) throw error
  return toClient(data)
}

export async function updateClient(supabase: DbClient, businessId: string, clientId: string, patch: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update({
      auth_user_id: patch.authUserId,
      name: patch.name,
      phone: patch.phone,
      email: patch.email,
      date_of_birth: patch.dateOfBirth,
      notes: patch.notes,
      source: patch.source,
    })
    .eq('business_id', businessId)
    .eq('id', clientId)
    .select('*')
    .single()
  if (error) throw error
  return toClient(data)
}

export async function findOrCreateClient(
  supabase: DbClient,
  businessId: string,
  input: {
    name: string
    email?: string | null
    phone?: string | null
    dateOfBirth?: string | null
    authUserId?: string | null
    source?: Client['source']
    notes?: string | null
  }
) {
  const authUserId = input.authUserId ?? null

  let existing: Client | null = null
  if (authUserId) {
    existing = await getClientByAuthUserId(supabase, businessId, authUserId)
  }
  if (!existing && input.email) {
    existing = await getClientByEmail(supabase, businessId, input.email)
  }
  if (!existing && input.phone) {
    existing = await getClientByPhone(supabase, businessId, input.phone)
  }

  if (existing) {
    return updateClient(supabase, businessId, existing.id, {
      ...existing,
      name: input.name || existing.name,
      email: input.email ?? existing.email,
      phone: input.phone ?? existing.phone,
      dateOfBirth: input.dateOfBirth ?? existing.dateOfBirth,
      authUserId: authUserId ?? existing.authUserId,
      source: input.source ?? existing.source,
      notes: input.notes ?? existing.notes,
    })
  }

  return createClient(supabase, businessId, {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    authUserId,
    source: input.source ?? 'manual',
    notes: input.notes ?? null,
  })
}

export async function getClientByAuthUserId(supabase: DbClient, businessId: string, authUserId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw error
  return data ? toClient(data) : null
}

// For the client portal, which isn't scoped to a single businessId ahead of
// time - the "clients can read their own record" RLS policy already scopes
// this to the caller's own row(s), same as getClientAppointmentsForPortal.
export async function getPortalClientForAuthUser(supabase: DbClient, authUserId: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('auth_user_id', authUserId).limit(1).maybeSingle()
  if (error) throw error
  return data ? toClient(data) : null
}

import type { Patient } from '@/types'
import type { DbClient } from './_shared'

export function toPatient(row: any): Patient {
  return {
    id: row.id,
    businessId: row.business_id,
    authUserId: row.auth_user_id ?? null,
    name: row.name,
    phone: row.phone ?? null,
    email: row.email ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    notes: row.notes ?? null,
    insuranceProvider: row.insurance_provider ?? null,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listPatientsForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('patients').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toPatient)
}

export async function searchPatients(supabase: DbClient, businessId: string, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return listPatientsForBusiness(supabase, businessId)

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('business_id', businessId)
    .or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toPatient)
}

export async function getPatientById(supabase: DbClient, businessId: string, patientId: string) {
  const { data, error } = await supabase.from('patients').select('*').eq('business_id', businessId).eq('id', patientId).maybeSingle()
  if (error) throw error
  return data ? toPatient(data) : null
}

export async function getPatientByEmail(supabase: DbClient, businessId: string, email: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('business_id', businessId)
    .ilike('email', email)
    .maybeSingle()
  if (error) throw error
  return data ? toPatient(data) : null
}

export async function getPatientByPhone(supabase: DbClient, businessId: string, phone: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .maybeSingle()
  if (error) throw error
  return data ? toPatient(data) : null
}

export async function createPatient(
  supabase: DbClient,
  businessId: string,
  input: {
    name: string
    email?: string | null
    phone?: string | null
    dateOfBirth?: string | null
    notes?: string | null
    insuranceProvider?: string | null
    source?: Patient['source']
    authUserId?: string | null
  }
) {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      business_id: businessId,
      auth_user_id: input.authUserId ?? null,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      notes: input.notes ?? null,
      insurance_provider: input.insuranceProvider ?? null,
      source: input.source ?? 'manual',
    })
    .select('*')
    .single()
  if (error) throw error
  return toPatient(data)
}

export async function updatePatient(supabase: DbClient, businessId: string, patientId: string, patch: Partial<Patient>) {
  const { data, error } = await supabase
    .from('patients')
    .update({
      auth_user_id: patch.authUserId,
      name: patch.name,
      phone: patch.phone,
      email: patch.email,
      date_of_birth: patch.dateOfBirth,
      notes: patch.notes,
      insurance_provider: patch.insuranceProvider,
      source: patch.source,
    })
    .eq('business_id', businessId)
    .eq('id', patientId)
    .select('*')
    .single()
  if (error) throw error
  return toPatient(data)
}

export async function findOrCreatePatient(
  supabase: DbClient,
  businessId: string,
  input: {
    name: string
    email?: string | null
    phone?: string | null
    dateOfBirth?: string | null
    authUserId?: string | null
    source?: Patient['source']
    notes?: string | null
  }
) {
  const authUserId = input.authUserId ?? null

  let existing: Patient | null = null
  if (authUserId) {
    existing = await getPatientByAuthUserId(supabase, businessId, authUserId)
  }
  if (!existing && input.email) {
    existing = await getPatientByEmail(supabase, businessId, input.email)
  }
  if (!existing && input.phone) {
    existing = await getPatientByPhone(supabase, businessId, input.phone)
  }

  if (existing) {
    return updatePatient(supabase, businessId, existing.id, {
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

  return createPatient(supabase, businessId, {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    authUserId,
    source: input.source ?? 'manual',
    notes: input.notes ?? null,
  })
}

export async function getPatientByAuthUserId(supabase: DbClient, businessId: string, authUserId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('business_id', businessId)
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw error
  return data ? toPatient(data) : null
}

// For the patient portal, which isn't scoped to a single businessId ahead of
// time - the "patients can read their own record" RLS policy already scopes
// this to the caller's own row(s), same as getPatientAppointmentsForPortal.
export async function getPortalPatientForAuthUser(supabase: DbClient, authUserId: string) {
  const { data, error } = await supabase.from('patients').select('*').eq('auth_user_id', authUserId).limit(1).maybeSingle()
  if (error) throw error
  return data ? toPatient(data) : null
}

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getBusinessForUser, getBusinessById } from '@/services/business'
import { getPortalPatientForAuthUser } from '@/services/patients'
import type { BusinessMemberRole } from '@/types'

export async function getServerSupabaseAndUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return { supabase, user }
}

export function getAdminSupabase() {
  return createAdminClient()
}

export async function getBusinessForCurrentUser(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string) {
  return getBusinessForUser(supabase, userId)
}

export async function getBusinessMembershipRole(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  businessId: string,
  userId: string
): Promise<BusinessMemberRole | null> {
  const result: any = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle()
  const { data, error } = result

  if (error) {
    throw error
  }

  return (data?.role as BusinessMemberRole | undefined) ?? null
}

export function canManageBusiness(role: BusinessMemberRole | null) {
  return role === 'owner' || role === 'admin'
}

// Used by the patient-facing portal pages (home, appointments, support):
// resolves the signed-in user's linked patient record and clinic in one
// call. The patient lookup uses the authenticated client (RLS allows a
// user to read a patients row that already carries their own auth_user_id);
// the business lookup needs the admin client since patients have no RLS
// grant on the businesses table.
export async function getPortalContext() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, patient: null, business: null }
  }

  const patient = await getPortalPatientForAuthUser(supabase, user.id)
  if (!patient) {
    return { user, patient: null, business: null }
  }

  const admin = createAdminClient()
  const business = await getBusinessById(admin, patient.businessId)

  return { user, patient, business }
}

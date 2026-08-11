import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getBusinessForUser, getBusinessById } from '@/services/business'
import { getPortalClientForAuthUser } from '@/services/clients'
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

// Used by the client-facing portal pages (home, appointments, support):
// resolves the signed-in user's linked client record and business in one
// call. The client lookup uses the authenticated client (RLS allows a
// user to read a clients row that already carries their own auth_user_id);
// the business lookup needs the admin client since clients have no RLS
// grant on the businesses table.
export async function getPortalContext() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, client: null, business: null }
  }

  const client = await getPortalClientForAuthUser(supabase, user.id)
  if (!client) {
    return { user, client: null, business: null }
  }

  const admin = createAdminClient()
  const business = await getBusinessById(admin, client.businessId)

  return { user, client, business }
}

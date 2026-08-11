import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json } from '@/lib/api'
import { getServerSupabaseAndUser, getBusinessForCurrentUser } from '@/lib/route-helpers'
import { getPublicBusinessProfile } from '@/services/business'
import { getWebsiteBySlug, getWebsiteByBusinessId } from '@/services/websites'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const websiteSlug = url.searchParams.get('slug')
  const businessSlug = url.searchParams.get('businessSlug')
  const publicMode = url.searchParams.get('public') === '1' || Boolean(websiteSlug || businessSlug)

  if (publicMode) {
    const admin = createAdminClient()
    if (websiteSlug) {
      const website = await getWebsiteBySlug(admin, websiteSlug)
      if (!website) {
        return apiError('Website not found', 404)
      }
      return json({ website })
    }

    if (businessSlug) {
      const business = await getPublicBusinessProfile(admin, businessSlug)
      if (!business) {
        return apiError('Business not found', 404)
      }
      const website = await getWebsiteByBusinessId(admin, business.id)
      return json({ website, business })
    }
  }

  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const website = await getWebsiteByBusinessId(supabase, business.id)
  return json({ website, business })
}

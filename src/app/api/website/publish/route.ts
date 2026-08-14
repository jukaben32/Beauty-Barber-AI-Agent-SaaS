import { z } from 'zod'
import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getBusinessMembershipRole, getServerSupabaseAndUser, canManageBusiness } from '@/lib/route-helpers'
import { getWebsiteByBusinessId, publishWebsite } from '@/services/websites'
import { getSubscription } from '@/services/business'

const publishSchema = z.object({
  websiteId: z.string().uuid().optional(),
  published: z.boolean().optional(),
})

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const role = await getBusinessMembershipRole(supabase, business.id, user.id)
  if (!canManageBusiness(role) && business.ownerId !== user.id) {
    return apiError('Forbidden', 403)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid publish payload', 422, { issues: parsed.error.flatten() })
  }

  if (parsed.data.published ?? true) {
    const subscription = await getSubscription(supabase, business.id)
    if (!subscription?.websiteBuilderEnabled) {
      return apiError('The Website Builder add-on is required to publish your site — upgrade first.', 402)
    }
  }

  const website = parsed.data.websiteId
    ? await publishWebsite(supabase, business.id, parsed.data.websiteId, parsed.data.published ?? true)
    : await (async () => {
        const current = await getWebsiteByBusinessId(supabase, business.id)
        if (!current) {
          throw new Error('Website not found')
        }
        return publishWebsite(supabase, business.id, current.id, parsed.data.published ?? true)
      })()

  return json({ website })
}

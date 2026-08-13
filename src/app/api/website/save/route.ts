import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getBusinessMembershipRole, getServerSupabaseAndUser, canManageBusiness } from '@/lib/route-helpers'
import { createOrUpdateWebsite, getWebsiteContentForBusiness, saveWebsiteContent } from '@/services/websites'
import { saveWebsiteContentSchema, websiteSchema } from '@/validations'

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

  try {
    if (body && typeof body === 'object' && 'website' in body) {
      const parsed = saveWebsiteContentSchema.safeParse(body)
      if (!parsed.success) {
        return apiError('Invalid website payload', 422, { issues: parsed.error.flatten() })
      }

      const content = await saveWebsiteContent(supabase, business.id, parsed.data)
      return json(content)
    }

    const parsed = websiteSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('Invalid website payload', 422, { issues: parsed.error.flatten() })
    }

    await createOrUpdateWebsite(supabase, business.id, {
      slug: parsed.data.slug,
      agentId: parsed.data.agentId ?? null,
      template: parsed.data.template,
      published: parsed.data.published,
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      font: parsed.data.font,
      siteTitle: parsed.data.siteTitle,
      siteDescription: parsed.data.siteDescription,
      heroHeadline: parsed.data.heroHeadline ?? null,
      heroSubheadline: parsed.data.heroSubheadline ?? null,
      heroImageUrl: parsed.data.heroImageUrl ?? null,
      ctaPrimaryText: parsed.data.ctaPrimaryText,
      ctaSecondaryText: parsed.data.ctaSecondaryText,
      aboutTitle: parsed.data.aboutTitle,
      aboutStory: parsed.data.aboutStory ?? null,
      aboutPhotoUrl: parsed.data.aboutPhotoUrl ?? null,
      footerTagline: parsed.data.footerTagline ?? null,
      footerCopyright: parsed.data.footerCopyright ?? null,
      contactPhone: parsed.data.contactPhone ?? null,
      contactEmail: parsed.data.contactEmail ?? null,
      contactAddress: parsed.data.contactAddress ?? null,
      contactHours: parsed.data.contactHours ?? null,
      contactMapsUrl: parsed.data.contactMapsUrl ?? null,
      yearsExperience: parsed.data.yearsExperience ?? null,
      clientsServed: parsed.data.clientsServed ?? null,
      satisfactionPct: parsed.data.satisfactionPct ?? null,
      trustBadges: parsed.data.trustBadges ?? [],
      featuredServiceIds: parsed.data.featuredServiceIds ?? [],
      socialYoutube: parsed.data.socialYoutube ?? null,
      socialFacebook: parsed.data.socialFacebook ?? null,
      socialInstagram: parsed.data.socialInstagram ?? null,
      socialTiktok: parsed.data.socialTiktok ?? null,
      socialLinkedin: parsed.data.socialLinkedin ?? null,
      socialPinterest: parsed.data.socialPinterest ?? null,
      socialTwitter: parsed.data.socialTwitter ?? null,
    })

    const content = await getWebsiteContentForBusiness(supabase, business.id)
    return json(content)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar'
    if (message.toLowerCase().includes('slug')) {
      return apiError(message, 409)
    }
    return apiError(message, 500)
  }
}

export async function PATCH(request: Request) {
  return POST(request)
}

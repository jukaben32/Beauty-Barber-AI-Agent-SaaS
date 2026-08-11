import { z } from 'zod'
import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getBusinessMembershipRole, getServerSupabaseAndUser, canManageBusiness } from '@/lib/route-helpers'
import { businessSchema } from '@/validations'
import { createBusiness, getBusinessAvailability, getBusinessById, getClosedDates, getDashboardAnalytics, getSubscription, listBusinessMembers, updateBusiness } from '@/services/business'
import { listAgentsForBusiness } from '@/services/agents'
import { listClinicServices } from '@/services/services'
import { listWidgetsForBusiness } from '@/services/widgets'
import { getWebsiteByBusinessId } from '@/services/websites'
import { listNotificationsForBusiness, getUnreadNotificationCount } from '@/services/notifications'
import { listKnowledgeDocuments } from '@/services/faqs'
import { getBillingSummary } from '@/services/billing'

const updateBusinessSchema = businessSchema
  .extend({
    paymentWalletAddress: z.string().min(4).optional().nullable(),
    paymentChainId: z.number().int().positive().optional().nullable(),
    paymentCurrency: z.string().min(3).max(10).optional(),
    bookingDepositAmount: z.number().positive().optional().nullable(),
    onboardingStep: z.enum(['created', 'profile', 'agent', 'services', 'billing', 'done']).optional(),
  })
  .partial()

async function loadBusinessContext(supabase: Awaited<ReturnType<typeof getServerSupabaseAndUser>>['supabase'], businessId: string) {
  const [
    business,
    subscription,
    members,
    agents,
    services,
    availability,
    closedDates,
    widget,
    website,
    notifications,
    unreadNotifications,
    analytics,
    knowledgeDocuments,
    billingSummary,
  ] = await Promise.all([
    getBusinessById(supabase, businessId),
    getSubscription(supabase, businessId),
    listBusinessMembers(supabase, businessId),
    listAgentsForBusiness(supabase, businessId),
    listClinicServices(supabase, businessId),
    getBusinessAvailability(supabase, businessId),
    getClosedDates(supabase, businessId),
    listWidgetsForBusiness(supabase, businessId),
    getWebsiteByBusinessId(supabase, businessId),
    listNotificationsForBusiness(supabase, businessId, 10),
    getUnreadNotificationCount(supabase, businessId),
    getDashboardAnalytics(supabase, businessId),
    listKnowledgeDocuments(supabase, businessId, false),
    getBillingSummary(supabase, businessId),
  ])

  return {
    business,
    subscription,
    members,
    agents,
    services,
    availability,
    closedDates,
    widget,
    website,
    notifications,
    unreadNotifications,
    analytics,
    knowledgeDocuments,
    billingSummary,
  }
}

export async function GET() {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return json({
      business: null,
      subscription: null,
      members: [],
      agents: [],
      services: [],
      availability: [],
      closedDates: [],
      widget: null,
      website: null,
      notifications: [],
      unreadNotifications: 0,
      analytics: null,
      knowledgeDocuments: [],
      billingSummary: { total: 0, confirmed: 0, pending: 0, count: 0 },
    })
  }

  const context = await loadBusinessContext(supabase, business.id)
  return json(context)
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = businessSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid business payload', 422, { issues: parsed.error.flatten() })
  }

  const business = await createBusiness(supabase, {
    ownerId: user.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    specialty: parsed.data.specialty ?? null,
    description: parsed.data.description ?? null,
    contactEmail: parsed.data.contactEmail ?? null,
    phone: parsed.data.phone ?? null,
    timezone: parsed.data.timezone ?? null,
  })

  const context = await loadBusinessContext(supabase, business.id)
  return json(context, { status: 201 })
}

export async function PATCH(request: Request) {
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

  const parsed = updateBusinessSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid business payload', 422, { issues: parsed.error.flatten() })
  }

  const updatePayload = {
    ...parsed.data,
  }

  const updated = await updateBusiness(supabase, business.id, updatePayload)
  const context = await loadBusinessContext(supabase, updated.id)
  return json(context)
}

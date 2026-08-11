import type { Business, BusinessAvailability, BusinessMember, BusinessSubscription, DashboardAnalytics, PublicBusinessProfile } from '@/types'
import { DEFAULT_APPOINTMENT_SLOT_MINUTES, DEFAULT_CURRENCY, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR, DEFAULT_TIME_ZONE, DEFAULT_WIDGET_TONE, DEFAULT_WELCOME_MESSAGE, DEFAULT_SITE_FONT } from '@/constants'
import { slugify, toTitleCase } from '@/lib/utils'
import type { DbClient } from './_shared'

function toBusiness(row: any): Business {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    specialty: row.specialty ?? null,
    description: row.description ?? null,
    logoUrl: row.logo_url ?? null,
    phone: row.phone ?? null,
    contactEmail: row.contact_email ?? null,
    bookingEmail: row.booking_email ?? null,
    address: row.address ?? null,
    website: row.website ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zipCode: row.zip_code ?? null,
    timezone: row.timezone,
    paymentWalletAddress: row.payment_wallet_address ?? null,
    paymentChainId: row.payment_chain_id ?? 137,
    paymentCurrency: row.payment_currency ?? DEFAULT_CURRENCY,
    bookingDepositAmount: row.booking_deposit_amount ?? null,
    onboardingStep: row.onboarding_step,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toAvailability(row: any): BusinessAvailability {
  return {
    id: row.id,
    businessId: row.business_id,
    dayOfWeek: row.day_of_week,
    isActive: row.is_active,
    openTime: row.open_time,
    closeTime: row.close_time,
    breakStart: row.break_start ?? null,
    breakEnd: row.break_end ?? null,
    slotMinutes: row.slot_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSubscription(row: any): BusinessSubscription {
  return {
    id: row.id,
    businessId: row.business_id,
    plan: row.plan,
    status: row.status,
    websiteBuilderEnabled: row.website_builder_enabled,
    billingEnabled: row.billing_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMember(row: any): BusinessMember {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPublicProfile(row: any): PublicBusinessProfile {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    specialty: row.specialty ?? null,
    description: row.description ?? null,
    logoUrl: row.logo_url ?? null,
    phone: row.phone ?? null,
    bookingEmail: row.booking_email ?? null,
    timezone: row.timezone ?? DEFAULT_TIME_ZONE,
    address: row.address ?? null,
    website: row.website ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zipCode: row.zip_code ?? null,
    paymentWalletAddress: row.payment_wallet_address ?? null,
    paymentChainId: row.payment_chain_id ?? 137,
    paymentCurrency: row.payment_currency ?? DEFAULT_CURRENCY,
  }
}

export async function getBusinessForOwner(supabase: DbClient, ownerId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0] ? toBusiness(data[0]) : null
}

export async function getBusinessForUser(supabase: DbClient, userId: string) {
  const { data: owned, error: ownedError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (ownedError) throw ownedError
  if (owned?.[0]) return toBusiness(owned[0])

  const { data: membership, error: membershipError } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (membershipError) throw membershipError
  if (!membership?.[0]?.business_id) return null

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', membership[0].business_id)
    .order('created_at', { ascending: false })
    .limit(1)
  if (businessError) throw businessError
  return business?.[0] ? toBusiness(business[0]) : null
}

export async function getBusinessMembership(supabase: DbClient, businessId: string, userId: string) {
  const { data, error } = await supabase
    .from('business_members')
    .select('*')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? toMember(data) : null
}

export async function getBusinessBySlug(supabase: DbClient, slug: string) {
  const { data, error } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? toBusiness(data) : null
}

export async function getBusinessById(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('businesses').select('*').eq('id', businessId).maybeSingle()
  if (error) throw error
  return data ? toBusiness(data) : null
}

export async function getPublicBusinessProfile(supabase: DbClient, slug: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, specialty, description, logo_url, phone, booking_email, timezone, address, website, city, state, zip_code, payment_wallet_address, payment_chain_id, payment_currency')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data ? toPublicProfile(data) : null
}

export async function listBusinessMembers(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('business_members').select('*').eq('business_id', businessId).order('created_at')
  if (error) throw error
  return (data ?? []).map(toMember)
}

export async function getSubscription(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('business_subscriptions').select('*').eq('business_id', businessId).maybeSingle()
  if (error) throw error
  return data ? toSubscription(data) : null
}

export async function createBusiness(
  supabase: DbClient,
  input: {
    ownerId: string
    name: string
    slug?: string
    specialty?: string | null
    description?: string | null
    contactEmail?: string | null
    phone?: string | null
    timezone?: string | null
  }
) {
  const baseSlug = slugify(input.slug || input.name)
  // businesses.slug is unique — a base slug alone collides whenever two
  // signups produce the same name (the same clinic name tried more than
  // once, two different clinics with a common name, etc.), and that
  // collision used to bubble up as an unhandled Postgres error that crashed
  // the whole dashboard layout on the very next login. Retry with a short
  // random suffix instead of failing outright.
  let business: Business | null = null
  let lastError: unknown = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: input.ownerId,
        name: input.name,
        slug,
        specialty: input.specialty ?? null,
        description: input.description ?? null,
        contact_email: input.contactEmail ?? null,
        phone: input.phone ?? null,
        timezone: input.timezone || DEFAULT_TIME_ZONE,
        booking_deposit_amount: 49,
        payment_currency: DEFAULT_CURRENCY,
        payment_chain_id: 137,
        onboarding_step: 'profile',
      })
      .select('*')
      .single()

    if (!error) {
      business = toBusiness(data)
      break
    }
    lastError = error
    // 23505 = unique_violation. Only the slug collision is worth retrying;
    // any other error (bad owner_id, RLS, connection issue) should surface
    // immediately instead of retrying blindly.
    if ((error as { code?: string }).code !== '23505') throw error
  }
  if (!business) throw lastError

  const defaultAgentName = `${toTitleCase(input.name)} Assistant`
  const defaultPrompt = `You are Clara, the AI medical receptionist for ${input.name}. Help clients book appointments, answer FAQs, and follow the clinic scheduling rules. Be concise, empathetic, and safe.`

  const [{ error: subscriptionError }, { error: memberError }, { data: agentData, error: agentError }] = await Promise.all([
    supabase.from('business_subscriptions').insert({
      business_id: business.id,
      plan: 'free',
      status: 'active',
      website_builder_enabled: true,
      billing_enabled: true,
    }),
    supabase.from('business_members').insert({
      business_id: business.id,
      user_id: input.ownerId,
      role: 'owner',
    }),
    supabase
      .from('ai_agents')
      .insert({
        business_id: business.id,
        name: 'Clara',
        title: defaultAgentName,
        specialty: input.specialty ?? 'General Practice',
        voice: 'alloy',
        personality: 'friendly',
        sensitivity: 0.55,
        greeting_message: DEFAULT_WELCOME_MESSAGE,
        system_prompt: defaultPrompt,
        language: 'en',
        status: 'live',
      })
      .select('*')
      .single(),
  ])

  if (subscriptionError) throw subscriptionError
  if (memberError) throw memberError
  if (agentError) throw agentError

  const agentId = (agentData as any)?.id as string | undefined

  const serviceRows = [
    {
      business_id: business.id,
      name: 'General Consultation',
      description: 'Initial consultation for new or existing clients.',
      duration_minutes: 30,
      price_type: 'fixed',
      price: 99,
      currency: DEFAULT_CURRENCY,
      active: true,
      color: '#0f766e',
      instructions: 'Collect symptoms, reason for visit, and preferred dates.',
      sort_order: 0,
    },
    {
      business_id: business.id,
      name: 'Follow Up Visit',
      description: 'Short follow-up to review treatment progress.',
      duration_minutes: 15,
      price_type: 'fixed',
      price: 49,
      currency: DEFAULT_CURRENCY,
      active: true,
      color: '#0ea5e9',
      instructions: 'Ask whether anything changed since the last visit.',
      sort_order: 1,
    },
    {
      business_id: business.id,
      name: 'Specialist Review',
      description: 'Extended review with a specialist provider.',
      duration_minutes: 50,
      price_type: 'starting_at',
      price: 149,
      currency: DEFAULT_CURRENCY,
      active: true,
      color: '#8b5cf6',
      instructions: 'Ask for referral details and any prior test results.',
      sort_order: 2,
    },
  ]

  const availabilityRows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    business_id: business.id,
    day_of_week: dayOfWeek,
    is_active: dayOfWeek >= 1 && dayOfWeek <= 5,
    open_time: '09:00',
    close_time: '17:00',
    break_start: '12:00',
    break_end: '13:00',
    slot_minutes: DEFAULT_APPOINTMENT_SLOT_MINUTES,
  }))

  const seedOperations = [
    supabase.from('services').insert(serviceRows),
    supabase.from('business_availability').insert(availabilityRows),
    supabase.from('widgets').insert({
      business_id: business.id,
      agent_id: agentId ?? null,
      name: 'Primary Widget',
      slug: business.slug,
      enabled: true,
      position: 'bottom-right',
      theme: 'light',
      primary_color: DEFAULT_PRIMARY_COLOR,
      secondary_color: DEFAULT_SECONDARY_COLOR,
      tone: DEFAULT_WIDGET_TONE,
      greeting_message: DEFAULT_WELCOME_MESSAGE,
      allowed_origins: [],
      slot_duration: DEFAULT_APPOINTMENT_SLOT_MINUTES,
      show_branding: true,
    }),
    supabase.from('websites').insert({
      business_id: business.id,
      agent_id: agentId ?? null,
      slug: business.slug,
      template: 'serenity',
      published: false,
      primary_color: DEFAULT_PRIMARY_COLOR,
      secondary_color: DEFAULT_SECONDARY_COLOR,
      font: DEFAULT_SITE_FONT,
      site_title: input.name,
      site_description: input.description || `Book appointments with ${input.name}.`,
      hero_headline: 'Advanced care you can trust',
      hero_subheadline: 'Schedule appointments in seconds and let Clara handle the follow-up.',
      cta_primary_text: 'Book Appointment',
      cta_secondary_text: 'View Services',
      about_title: 'About the clinic',
      about_story: input.description || null,
      footer_tagline: 'Powered by Clara AI',
      footer_copyright: `Copyright ${new Date().getFullYear()} ${input.name}`,
      contact_phone: input.phone ?? null,
      contact_email: input.contactEmail ?? null,
      contact_address: null,
      contact_hours: 'Mon - Fri, 9:00 AM - 5:00 PM',
      years_experience: 20,
      clients_served: 12000,
      satisfaction_pct: 98.6,
      trust_badges: ['Board Certified', 'Client Centered', '24/7 AI Reception'],
      featured_service_ids: [],
    }),
  ]

  const results = await Promise.all(seedOperations)
  const seedError = results.find((result) => result.error)?.error
  if (seedError) throw seedError

  return business
}

export async function updateBusiness(
  supabase: DbClient,
  businessId: string,
  patch: Partial<Record<keyof Business, any>> & { timezone?: string | null }
) {
  const { data, error } = await supabase
    .from('businesses')
    .update({
      name: patch.name,
      slug: patch.slug,
      specialty: patch.specialty,
      description: patch.description,
      logo_url: patch.logoUrl,
      phone: patch.phone,
      contact_email: patch.contactEmail,
      booking_email: patch.bookingEmail,
      address: patch.address,
      website: patch.website,
      city: patch.city,
      state: patch.state,
      zip_code: patch.zipCode,
      timezone: patch.timezone ?? undefined,
      payment_wallet_address: patch.paymentWalletAddress,
      payment_chain_id: patch.paymentChainId,
      payment_currency: patch.paymentCurrency,
      booking_deposit_amount: patch.bookingDepositAmount,
      onboarding_step: patch.onboardingStep,
    })
    .eq('id', businessId)
    .select('*')
    .single()
  if (error) throw error
  return toBusiness(data)
}

export async function updateOnboardingStep(supabase: DbClient, businessId: string, onboardingStep: Business['onboardingStep']) {
  return updateBusiness(supabase, businessId, { onboardingStep })
}

export async function getBusinessAvailability(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('business_availability').select('*').eq('business_id', businessId).order('day_of_week')
  if (error) throw error
  return (data ?? []).map(toAvailability)
}

export async function upsertBusinessAvailability(
  supabase: DbClient,
  businessId: string,
  input: {
    dayOfWeek: number
    isActive: boolean
    openTime: string
    closeTime: string
    breakStart?: string | null
    breakEnd?: string | null
    slotMinutes?: number
  }
) {
  const { data, error } = await supabase
    .from('business_availability')
    .upsert(
      {
        business_id: businessId,
        day_of_week: input.dayOfWeek,
        is_active: input.isActive,
        open_time: input.openTime,
        close_time: input.closeTime,
        break_start: input.breakStart ?? null,
        break_end: input.breakEnd ?? null,
        slot_minutes: input.slotMinutes ?? DEFAULT_APPOINTMENT_SLOT_MINUTES,
      },
      { onConflict: 'business_id,day_of_week' }
    )
    .select('*')
    .single()
  if (error) throw error
  return toAvailability(data)
}

export async function getClosedDates(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('closed_dates').select('*').eq('business_id', businessId).order('blocked_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addClosedDate(
  supabase: DbClient,
  businessId: string,
  input: { blockedDate: string; reason?: string | null }
) {
  const { data, error } = await supabase
    .from('closed_dates')
    .upsert(
      {
        business_id: businessId,
        blocked_date: input.blockedDate,
        reason: input.reason ?? null,
      },
      { onConflict: 'business_id,blocked_date' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function removeClosedDate(supabase: DbClient, businessId: string, blockedDate: string) {
  const { error } = await supabase.from('closed_dates').delete().eq('business_id', businessId).eq('blocked_date', blockedDate)
  if (error) throw error
}

export async function getDashboardAnalytics(supabase: DbClient, businessId: string): Promise<DashboardAnalytics> {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [appointmentsToday, upcomingAppointments, totalClients, cancelledAppointments, completedAppointments, noShowAppointments, unreadNotifications, activeAgents, activeServices, totalConversations, bookedConversations, callbacksRequested] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('scheduled_at', startOfDay.toISOString()).lt('scheduled_at', new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('scheduled_at', now.toISOString()).neq('status', 'cancelled'),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'cancelled').gte('created_at', startOfMonth.toISOString()),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'completed').gte('created_at', startOfMonth.toISOString()),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'no_show').gte('created_at', startOfMonth.toISOString()),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('business_id', businessId).is('read_at', null),
    supabase.from('ai_agents').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'live'),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('active', true),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('outcome', 'booked_appointment'),
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('outcome', 'escalated'),
  ])

  return {
    appointmentsToday: appointmentsToday.count ?? 0,
    upcomingAppointments: upcomingAppointments.count ?? 0,
    totalClients: totalClients.count ?? 0,
    cancelledAppointments: cancelledAppointments.count ?? 0,
    completedAppointments: completedAppointments.count ?? 0,
    noShowAppointments: noShowAppointments.count ?? 0,
    unreadNotifications: unreadNotifications.count ?? 0,
    activeAgents: activeAgents.count ?? 0,
    activeServices: activeServices.count ?? 0,
    totalConversations: totalConversations.count ?? 0,
    bookedConversations: bookedConversations.count ?? 0,
    callbacksRequested: callbacksRequested.count ?? 0,
  }
}

export async function ensureBusinessMemberExists(supabase: DbClient, businessId: string, userId: string, role: BusinessMember['role'] = 'staff') {
  const { data, error } = await supabase
    .from('business_members')
    .upsert({
      business_id: businessId,
      user_id: userId,
      role,
    })
    .select('*')
    .single()
  if (error) throw error
  return toMember(data)
}

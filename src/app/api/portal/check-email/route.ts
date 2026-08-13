import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { portalCheckEmailSchema } from '@/validations'
import { getBusinessBySlug } from '@/services/business'
import { findOrCreateClient, getClientByEmail } from '@/services/clients'

function isPortalPath(pathname: string) {
  return pathname === '/portal' || pathname.startsWith('/portal/')
}

function normalizePortalNext(input: string | null, fallback: string) {
  if (!input) {
    return fallback
  }

  try {
    const nextUrl = new URL(input, new URL(fallback, 'http://localhost').origin)
    if (
      nextUrl.pathname === '/portal/login' ||
      nextUrl.pathname === '/portal/register' ||
      !isPortalPath(nextUrl.pathname)
    ) {
      return fallback
    }

    return `${nextUrl.pathname}${nextUrl.search}`
  } catch {
    return fallback
  }
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = portalCheckEmailSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid email payload', 422, { issues: parsed.error.flatten() })
  }

  const businessSlug = parsed.data.businessSlug || new URL(request.url).searchParams.get('businessSlug') || ''
  if (!businessSlug) {
    return apiError('businessSlug is required', 400)
  }

  const admin = createAdminClient()

  // Two limits: per IP (stop one caller from spamming many inboxes) and per
  // email (stop many callers from email-bombing one victim's inbox).
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(admin, { key: `check-email-ip:${getClientIp(request)}`, limit: 10, windowSeconds: 300 }),
    checkRateLimit(admin, { key: `check-email-addr:${parsed.data.email.toLowerCase()}`, limit: 5, windowSeconds: 300 }),
  ])
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return apiError('Too many requests. Please try again in a few minutes.', 429)
  }

  const business = await getBusinessBySlug(admin, businessSlug)
  if (!business) {
    return apiError('Business not found', 404)
  }

  let client = await getClientByEmail(admin, business.id, parsed.data.email)

  // Registration form: create/update the client record with the name and
  // phone the visitor just typed, before the magic link goes out, so that
  // when they click through, the auth callback finds this record (by
  // email) instead of creating a bare placeholder client.
  if (parsed.data.name) {
    client = await findOrCreateClient(admin, business.id, {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      source: 'portal',
    })
  }

  const supabase = await createServerSupabaseClient()
  const redirectUrl = new URL('/api/auth/callback', origin)
  const defaultNext = `/portal?businessSlug=${encodeURIComponent(business.slug)}`
  const requestedNext = parsed.data.next || new URL(request.url).searchParams.get('next')
  redirectUrl.searchParams.set('next', normalizePortalNext(requestedNext, defaultNext))

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectUrl.toString(),
    },
  })

  if (error) {
    return apiError(error.message, 400)
  }

  return json({
    sent: true,
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
    },
    clientExists: Boolean(client),
  })
}

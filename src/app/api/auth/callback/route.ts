import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessBySlug } from '@/services/business'
import { findOrCreateClient } from '@/services/clients'

function normalizeAuthNext(input: string | null, fallback: string, origin: string) {
  if (!input) {
    return fallback
  }

  try {
    const nextUrl = new URL(input, origin)
    if (nextUrl.origin !== origin) {
      return fallback
    }

    return `${nextUrl.pathname}${nextUrl.search}`
  } catch {
    return fallback
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = normalizeAuthNext(url.searchParams.get('next'), '/dashboard', url.origin)

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin))
  }

  // Portal magic links land here too. A client who booked as a guest (via
  // the voice agent or widget) already has a `clients` row keyed by email
  // but no `auth_user_id` - link this login to that existing row instead of
  // leaving them stuck looking at someone else's blank dashboard. This must
  // use the admin client: the clients RLS policies only let a session
  // update/select a row that *already* has its own auth_user_id, which is
  // exactly the chicken-and-egg case being resolved here.
  if (data.user?.email && next.startsWith('/portal')) {
    try {
      const nextUrl = new URL(next, url.origin)
      const businessSlug = nextUrl.searchParams.get('businessSlug')
      if (businessSlug) {
        const admin = createAdminClient()
        const business = await getBusinessBySlug(admin, businessSlug)
        if (business) {
          await findOrCreateClient(admin, business.id, {
            name: data.user.email,
            email: data.user.email,
            authUserId: data.user.id,
            source: 'portal',
          })
        }
      }
    } catch {
      // Don't block login over this - worst case the dashboard shows no
      // upcoming appointments until the client's record is linked some
      // other way (e.g. staff sets it from the dashboard).
    }
  }

  // Create the response FIRST so cookies from supabase.auth.exchangeCodeForSession
  // are attached to it, then set the redirect. This ensures session cookies
  // survive the redirect (otherwise auth gets lost on the next request).
  const response = NextResponse.redirect(new URL(next, url.origin))
  return response
}

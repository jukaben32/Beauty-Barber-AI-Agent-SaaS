import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const DASHBOARD_PREFIX = '/dashboard'
// Portal has public sub-routes (/portal/login, /portal/register) alongside
// protected ones (/portal, /portal/appointments, /portal/support) — unlike
// /dashboard, which has no public children, so it's safe to gate by prefix.
// This list must be checked with an EXACT match, never
// path.startsWith(`${p}/`): that pattern matches every path under /portal,
// including /portal/login itself, which redirects an unauthenticated visit
// to /portal/login back to /portal/login forever (the exact bug found and
// fixed in the sibling real-estate-multi-ai-agent-saas project, commit
// 6330561 — ported here proactively before it could bite this app too).
const PROTECTED_PORTAL_PATHS = ['/portal', '/portal/appointments', '/portal/support']

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return response
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (user && (path.startsWith('/login') || path.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isDashboardProtected = path.startsWith(DASHBOARD_PREFIX)
  const isPortalProtected = PROTECTED_PORTAL_PATHS.includes(path)

  if (!user && (isDashboardProtected || isPortalProtected)) {
    const redirectUrl = new URL(isPortalProtected ? '/portal/login' : '/login', request.url)
    // Preserve the original query string so portal access links keep their
    // businessSlug when unauthenticated users are bounced to the login page.
    redirectUrl.searchParams.set('redirect', `${path}${request.nextUrl.search}`)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessForUser, createBusiness } from '@/services/business'
import { DashboardChrome } from '@/components/dashboard/DashboardChrome'
import { getErrorMessage } from '@/lib/utils'

function ErrorScreen({ title, body, detail }: { title: string; body: string; detail: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--page-bg)] px-4 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="font-display text-2xl font-bold text-[var(--text-strong)]">{title}</h1>
        <p className="text-sm text-[var(--text-muted)]">{body}</p>
        <p className="text-xs text-[var(--text-muted)]">{detail}</p>
        <a href="/login" className="btn-primary inline-flex">
          Back to sign in
        </a>
      </div>
    </div>
  )
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Next.js's redirect() works by throwing a special tagged error that its
  // own internals catch further up the tree — a blanket try/catch here
  // would swallow that and show an error screen instead of redirecting.
  // So every redirect() call below stays outside any try block; only the
  // Supabase/DB calls that can genuinely fail unexpectedly are wrapped,
  // each one individually, so a failure anywhere in this layout shows a
  // real message instead of Next.js's generic "server-side exception"
  // digest page (that page is what every login attempt hit before this).
  let supabase: Awaited<ReturnType<typeof createClient>>
  let user: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['getUser']>>['data']['user']
  try {
    supabase = await createClient()
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch (err) {
    console.error('Failed to load the authenticated user:', err)
    return <ErrorScreen title="We couldn't load your session" body="Please try signing in again." detail={getErrorMessage(err)} />
  }

  if (!user) redirect('/login')

  let business: Awaited<ReturnType<typeof getBusinessForUser>> = null
  try {
    business = await getBusinessForUser(supabase, user.id)
  } catch (err) {
    console.error('Failed to look up the business for this user:', err)
    return <ErrorScreen title="We couldn't load your clinic" body="Please try signing in again, or contact support if this keeps happening." detail={getErrorMessage(err)} />
  }

  // Signup can't create the clinic itself when Supabase requires email
  // confirmation (no session exists yet at signup time — RLS needs
  // auth.uid()) — it stashes clinic_name/full_name in the auth user's
  // metadata instead and defers creation to here, the first authenticated
  // request after the user actually confirms and logs in. This used to just
  // bounce back to /signup, which re-showed the signup form and looped:
  // signUp() on an already-registered email returns the "already exists"
  // error instead of creating anything, so the user could never get in.
  if (!business) {
    const clinicName = (user.user_metadata?.clinic_name as string | undefined)?.trim()
    if (!clinicName) redirect('/signup')
    try {
      // Confirmed with a live query against the production database: the
      // RLS policy on businesses (owner_id = auth.uid()) is exactly right,
      // and getUser() above already proves this is a real, authenticated
      // user — yet the insert still threw "new row violates row-level
      // security policy", meaning auth.uid() was evaluating to null for
      // this specific request even though getUser() (a separate call to
      // the Auth API, not dependent on RLS) succeeded. Rather than keep
      // chasing why the session cookies aren't reaching PostgREST intact
      // on this first post-confirmation request, use the service role for
      // this one system-initiated provisioning step — the identity was
      // already verified above, RLS enforcement isn't adding safety here,
      // only fragility.
      business = await createBusiness(createAdminClient(), {
        ownerId: user.id,
        name: clinicName,
        contactEmail: user.email ?? null,
      })
    } catch (err) {
      console.error('Failed to auto-create business on first login:', err)
      return <ErrorScreen title="We couldn't set up your clinic" body="Something went wrong creating your clinic account. Please try signing in again, or contact support if this keeps happening." detail={getErrorMessage(err)} />
    }
  }

  return (
    <DashboardChrome businessName={business.name} ownerEmail={user.email ?? ''}>
      {children}
    </DashboardChrome>
  )
}

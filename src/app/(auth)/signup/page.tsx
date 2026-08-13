'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft, MailCheck, Rocket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createBusiness } from '@/services/business'
import { BrandMark, SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'
import { getErrorMessage } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Set once signUp() succeeds but Supabase requires email confirmation
  // before a session exists — the business can't be created yet (RLS needs an
  // authenticated session), so it's created the first time this account
  // actually logs in with a session (see the dashboard layout).
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    // Everything below can throw for reasons that have nothing to do with
    // a normal { data, error } auth failure — createClient() itself throws
    // if the Supabase env vars aren't in this bundle, and a network hiccup
    // can reject signUp()'s promise outright. None of that used to be
    // caught, so it crashed the whole page as an uncaught client-side
    // exception instead of showing a message.
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, business_name: businessName },
          // Must point at /api/auth/callback, not straight at /login — that
          // route is what actually calls exchangeCodeForSession() to turn the
          // confirmation link's code into a real session. Pointing directly
          // at /login skipped that exchange entirely, so the confirmation
          // link never logged anyone in (this was the actual bug behind
          // "confirmé el correo y me salió una pantalla en blanco").
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // An existing, already-confirmed account signing up again comes back
      // with a user but an empty identities array and no error.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('Ya existe una cuenta con este correo. Intenta iniciar sesión.')
        return
      }

      if (!data.session) {
        setPendingEmail(email)
        return
      }

      await createBusiness(supabase, {
        ownerId: data.user!.id,
        name: businessName,
        contactEmail: email,
        phone: phone || null,
      })

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (pendingEmail) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-6">
        <SurfaceCard className="w-full max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--brand-soft)]">
            <MailCheck className="h-7 w-7 text-[var(--brand)]" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-[var(--text-strong)]">Check your email</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            We sent a confirmation link to <span className="font-semibold text-[var(--text-strong)]">{pendingEmail}</span>.
            Open it to verify your account, then sign in.
          </p>
          <button
            type="button"
            onClick={() => {
              setPendingEmail(null)
              setPassword('')
            }}
            className="btn-secondary mt-6 w-full justify-center py-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign up
          </button>
          <a href="/login" className="mt-3 block text-sm font-semibold text-[var(--brand)]">
            I already confirmed, sign in
          </a>
        </SurfaceCard>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen gap-8 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
      <SurfaceCard className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <SectionEyebrow>Start free trial</SectionEyebrow>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-strong)]">Create your business account</h2>

          {error && <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p>}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Business name</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Bloom Beauty Salon"
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yoursalon.com"
                className="input-field"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Phone number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="input-field"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? (
                'Creating…'
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Start 14-day trial
                </>
              )}
            </button>
            <div className="text-sm text-[var(--text-muted)]">No credit card required.</div>
            <p className="text-xs leading-6 text-[var(--text-muted)]">
              By starting a trial, you agree to our{' '}
              <a href="/terms" className="font-semibold text-[var(--brand)]">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="font-semibold text-[var(--brand)]">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-[var(--brand)]">
              Sign in
            </a>
          </p>
        </form>
      </SurfaceCard>

      <SurfaceCard className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,124,90,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(182,138,62,0.18),transparent_30%)]" />
        <div className="relative">
          <BrandMark />
          <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight sm:text-6xl">
            Launch a salon concierge experience in days, not months.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-white/76">
            Add the widget, configure AI settings, and keep every booking tied to the same source of truth.
          </p>
        </div>
      </SurfaceCard>
    </div>
  )
}

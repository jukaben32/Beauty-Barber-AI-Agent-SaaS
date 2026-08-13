'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandMark, SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'
import { getErrorMessage } from '@/lib/utils'

const DASHBOARD_BASE = 'http://localhost'

function normalizeDashboardNext(input: string | null) {
  if (!input) {
    return '/dashboard'
  }

  try {
    const nextUrl = new URL(input, DASHBOARD_BASE)
    if (nextUrl.origin !== DASHBOARD_BASE) {
      return '/dashboard'
    }

    if (nextUrl.pathname !== '/dashboard' && !nextUrl.pathname.startsWith('/dashboard/')) {
      return '/dashboard'
    }

    return `${nextUrl.pathname}${nextUrl.search}`
  } catch {
    return '/dashboard'
  }
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const redirectTarget = normalizeDashboardNext(searchParams.get('redirect'))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push(redirectTarget)
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen gap-8 px-4 py-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <SurfaceCard className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,124,90,0.25),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(182,138,62,0.18),transparent_30%)]" />
        <div className="relative">
          <BrandMark />
          <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight sm:text-6xl">
            The future of salon booking is here.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-white/76">
            The AI receptionist handles bookings 24/7 so your staff can focus on what matters most.
          </p>
          <div className="mt-8 space-y-3">
            <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4">
              <div className="text-sm font-bold">Clara-powered AI booking assistant</div>
              <div className="text-xs text-white/70">Clients can call, chat, or use the website widget.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4">
              <div className="text-sm font-bold">Secure, multi-tenant data model</div>
              <div className="text-xs text-white/70">Each business keeps its own appointments and settings.</div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <SectionEyebrow>Staff login</SectionEyebrow>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-strong)]">Welcome back</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">Sign in to your business dashboard.</p>

          {error && <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p>}

          <div className="mt-8 space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[var(--text-strong)]">Password</label>
                <a href="/forgot-password" className="text-xs font-semibold text-[var(--brand)]">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
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
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? (
                'Signing in…'
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have a business yet?{' '}
            <a href="/signup" className="font-semibold text-[var(--brand)]">
              Create one free
            </a>
          </p>
        </form>
      </SurfaceCard>
    </div>
  )
}

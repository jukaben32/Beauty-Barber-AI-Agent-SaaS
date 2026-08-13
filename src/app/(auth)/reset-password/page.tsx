'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandMark, SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'
import { getErrorMessage } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sessionValid, setSessionValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // /api/auth/callback already exchanged the recovery link's code for a
    // session and set the cookies before redirecting here - this just
    // confirms the browser client can see that session before letting the
    // user attempt updateUser(), which fails with a confusing error otherwise.
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setSessionValid(Boolean(data.session))
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) {
        setError(authError.message)
        return
      }
      setDone(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-6">
      <SurfaceCard className="w-full max-w-md p-8">
        <BrandMark />
        <SectionEyebrow>Staff login</SectionEyebrow>

        {!ready ? (
          <p className="mt-5 text-sm text-[var(--text-muted)]">Checking your reset link…</p>
        ) : !sessionValid ? (
          <div className="mt-5 space-y-4">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">Link expired</h1>
            <p className="text-sm leading-7 text-[var(--text-muted)]">
              This password reset link is invalid or has expired. Request a new one below.
            </p>
            <a href="/forgot-password" className="btn-primary w-full justify-center py-3">
              Request a new link
            </a>
          </div>
        ) : done ? (
          <div className="mt-5 space-y-4 text-center">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">Password updated</h1>
            <p className="text-sm leading-7 text-[var(--text-muted)]">Taking you to your dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">Set a new password</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">Choose a new password for your account.</p>

            {error && <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p>}

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-strong)]">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    required
                    minLength={8}
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-strong)]">Confirm new password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary mt-6 w-full justify-center py-3" disabled={loading}>
              {loading ? (
                'Updating…'
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Update password
                </>
              )}
            </button>
          </form>
        )}
      </SurfaceCard>
    </div>
  )
}

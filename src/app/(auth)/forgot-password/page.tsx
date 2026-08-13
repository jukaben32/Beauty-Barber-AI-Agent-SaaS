'use client'

import { useState } from 'react'
import { ArrowLeft, MailCheck, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrandMark, SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'
import { getErrorMessage } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent('/reset-password')}`
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (authError) {
        setError(authError.message)
        return
      }
      // Always show the same success state whether or not the email exists -
      // confirming account existence to an anonymous caller is an account
      // enumeration risk.
      setSent(true)
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

        {sent ? (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[rgba(15,118,110,0.1)] text-[var(--brand-strong)]">
              <MailCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">Check your email</h1>
            <p className="text-sm leading-7 text-[var(--text-muted)]">
              If an account exists for <strong>{email}</strong>, we sent a link to reset your password.
            </p>
            <a href="/login" className="btn-secondary w-full justify-center py-3">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">Reset your password</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Enter the email on your account and we&apos;ll send you a link to set a new password.
            </p>

            {error && <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p>}

            <div className="mt-6 space-y-2">
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

            <button type="submit" className="btn-primary mt-6 w-full justify-center py-3" disabled={loading}>
              {loading ? (
                'Sending…'
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Send reset link
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
              <a href="/login" className="font-semibold text-[var(--brand)]">
                Back to login
              </a>
            </p>
          </form>
        )}
      </SurfaceCard>
    </div>
  )
}

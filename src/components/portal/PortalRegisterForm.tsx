'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { SectionEyebrow } from '@/components/clinic/shared'

const PORTAL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function PortalRegisterForm() {
  const searchParams = useSearchParams()
  const [businessSlug, setBusinessSlug] = useState(searchParams.get('businessSlug')?.trim().toLowerCase() || '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const normalizedSlug = businessSlug.trim().toLowerCase()
    const normalizedEmail = email.trim()
    const normalizedName = name.trim()

    if (!normalizedSlug) {
      setError('Enter the clinic slug to create your account.')
      return
    }
    if (!PORTAL_SLUG_PATTERN.test(normalizedSlug)) {
      setError('Clinic slugs use lowercase letters, numbers, and hyphens only.')
      return
    }
    if (!normalizedName) {
      setError('Enter your full name.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/portal/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          businessSlug: normalizedSlug,
          name: normalizedName,
          phone: phone.trim() || undefined,
          next: `/portal?businessSlug=${encodeURIComponent(normalizedSlug)}`,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        setError(payload?.error || 'We could not create your portal account right now.')
        return
      }

      setSentTo(normalizedEmail)
    } catch {
      setError('Network error while creating your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 rounded-[24px] border border-[var(--brand)] bg-[var(--brand-soft)] px-5 py-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center bg-white text-[var(--brand-strong)]">
            <MailCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-strong)]">Check your inbox</div>
            <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
              We emailed <span className="font-semibold text-[var(--text-strong)]">{sentTo}</span> a secure login link. Open it to finish creating your portal account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSentTo(null)
            setError(null)
          }}
          className="btn-secondary w-full justify-center py-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Edit details
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <SectionEyebrow>Patient onboarding</SectionEyebrow>
      <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-strong)]">Create your portal profile</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
        We use this info to sync your appointments, reminders, and receipts. No password needed - we&apos;ll email you a secure login link.
      </p>

      {error ? <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--text-strong)]">Clinic slug</label>
          <input
            value={businessSlug}
            onChange={(event) => setBusinessSlug(event.target.value)}
            placeholder="clinic-demo"
            className="input-field"
            autoComplete="off"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-strong)]">Full name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              className="input-field"
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-strong)]">Phone number</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(555) 123-4567"
              className="input-field"
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--text-strong)]">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="patient@email.com"
            className="input-field"
            autoComplete="email"
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Create portal account'
          )}
        </button>
      </form>

      <div className="mt-4 rounded-[24px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <a href="/portal/login" className="font-semibold text-[var(--brand-strong)]">
          Sign in instead
        </a>
        .
      </div>
    </div>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { SectionEyebrow } from '@/components/dashboard/shared'

const PORTAL_BASE = 'http://localhost'
const PORTAL_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isPortalPath(pathname: string) {
  return pathname === '/portal' || pathname.startsWith('/portal/')
}

function extractPortalBusinessSlug(redirect: string | null) {
  if (!redirect) return ''

  try {
    const url = new URL(redirect, PORTAL_BASE)
    if (url.pathname === '/portal/login' || url.pathname === '/portal/register' || !isPortalPath(url.pathname)) {
      return ''
    }

    return url.searchParams.get('businessSlug')?.trim() || ''
  } catch {
    return ''
  }
}

function buildPortalNextTarget(nextPath: string | null, businessSlug: string) {
  const fallback = businessSlug ? `/portal?businessSlug=${encodeURIComponent(businessSlug)}` : '/portal'

  if (!nextPath) {
    return fallback
  }

  try {
    const url = new URL(nextPath, PORTAL_BASE)
    if (url.pathname === '/portal/login' || url.pathname === '/portal/register' || !isPortalPath(url.pathname)) {
      return fallback
    }

    if (businessSlug) {
      url.searchParams.set('businessSlug', businessSlug)
    }

    return `${url.pathname}${url.search}`
  } catch {
    return fallback
  }
}

function getPortalContext(searchParams: ReturnType<typeof useSearchParams>) {
  const redirect = searchParams.get('redirect')
  const directBusinessSlug = searchParams.get('businessSlug')?.trim().toLowerCase() || ''
  const redirectBusinessSlug = extractPortalBusinessSlug(redirect).toLowerCase()
  const businessSlug = directBusinessSlug || redirectBusinessSlug

  return {
    businessSlug,
    nextPath: buildPortalNextTarget(redirect, businessSlug),
  }
}

export function PortalLoginForm() {
  const searchParams = useSearchParams()
  const initialContext = getPortalContext(searchParams)
  const [businessSlug, setBusinessSlug] = useState(initialContext.businessSlug)
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const normalizedSlug = businessSlug.trim().toLowerCase()
    const normalizedEmail = email.trim()

    if (!normalizedSlug) {
      setError('Enter the business slug to receive your login link.')
      return
    }

    if (!PORTAL_SLUG_PATTERN.test(normalizedSlug)) {
      setError('Business slugs use lowercase letters, numbers, and hyphens only.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/portal/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          businessSlug: normalizedSlug,
          next: buildPortalNextTarget(initialContext.nextPath, normalizedSlug),
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string; business?: { name?: string; slug?: string } } | null

      if (!response.ok) {
        setError(payload?.error || 'We could not send the login link right now.')
        return
      }

      setSentTo(normalizedEmail)
    } catch {
      setError('Network error while sending the login link. Please try again.')
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
            <div className="text-sm font-bold text-[var(--text-strong)]">Magic link sent</div>
            <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
              We emailed <span className="font-semibold text-[var(--text-strong)]">{sentTo}</span>. Open the link in that inbox and you will return to the portal automatically.
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
          Send another link
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <SectionEyebrow>Portal login</SectionEyebrow>
      <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-strong)]">Welcome back</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
        Enter the business slug and your email to receive a secure magic link.
      </p>

      {error ? <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--text-strong)]">Business slug</label>
          <input
            value={businessSlug}
            onChange={(event) => setBusinessSlug(event.target.value)}
            placeholder="business-demo"
            className="input-field"
            autoComplete="off"
            required
          />
          <p className="text-xs leading-6 text-[var(--text-muted)]">
            Use the slug from your business portal URL. If you opened this page from a business site, it should already be filled in.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--text-strong)]">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="client@email.com"
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
            'Send magic link'
          )}
        </button>
      </form>

      <div className="mt-4 rounded-[24px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--text-muted)]">
        After verification, the link will bring you back to your portal destination.
      </div>
    </div>
  )
}

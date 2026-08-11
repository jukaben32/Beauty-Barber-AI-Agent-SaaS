'use client'

import { useMemo, useState } from 'react'
import { Check, CreditCard, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import type { Business, BusinessAvailability } from '@/types'
import { DAYS_OF_WEEK } from '@/constants'
import { createClient } from '@/lib/supabase/client'
import { updateBusiness, upsertBusinessAvailability, addClosedDate, removeClosedDate } from '@/services/business'
import type { StripeAccountStatus } from '@/services/stripeAccounts'
import { SectionEyebrow, SectionHeading, SurfaceCard, StatusBadge } from '@/components/clinic/shared'
import Tabs from '@/components/ui/Tabs'

type ClosedDateRow = { id: string; blocked_date: string; reason: string | null }

// Common IANA zones as a fallback for the rare browser without
// Intl.supportedValuesOf (Safari <17, older Firefox/Chromium).
const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Santo_Domingo',
  'America/Puerto_Rico',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Berlin',
]

function getSupportedTimezones() {
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    try {
      return (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf('timeZone')
    } catch {
      // fall through to the static list below
    }
  }
  return FALLBACK_TIMEZONES
}

// Currencies actually handled by formatCurrency (lib/utils.ts) plus common
// ISO-4217 fiat codes Intl.NumberFormat already supports out of the box.
const CURRENCY_OPTIONS = [
  { value: 'USDC', label: 'USDC (USD Coin)' },
  { value: 'USDT', label: 'USDT (Tether)' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'DOP', label: 'DOP - Dominican Peso' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
]

function defaultDay(dayOfWeek: number): BusinessAvailability {
  return {
    id: '',
    businessId: '',
    dayOfWeek,
    isActive: dayOfWeek >= 1 && dayOfWeek <= 5,
    openTime: '09:00',
    closeTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    slotMinutes: 30,
    createdAt: '',
    updatedAt: '',
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-[var(--text-strong)]">{children}</label>
}

export function SettingsManager({
  business,
  initialAvailability,
  initialClosedDates,
  initialStripeStatus,
}: {
  business: Business
  initialAvailability: BusinessAvailability[]
  initialClosedDates: ClosedDateRow[]
  initialStripeStatus: StripeAccountStatus
}) {
  const [tab, setTab] = useState<'profile' | 'hours' | 'payments'>('profile')

  const [profileForm, setProfileForm] = useState({
    name: business.name,
    phone: business.phone ?? '',
    email: business.bookingEmail ?? '',
    website: business.website ?? '',
    address: business.address ?? '',
    city: business.city ?? '',
    state: business.state ?? '',
    zipCode: business.zipCode ?? '',
    timezone: business.timezone,
    paymentCurrency: business.paymentCurrency,
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const timezoneOptions = useMemo(() => {
    const zones = getSupportedTimezones()
    return zones.includes(profileForm.timezone) ? zones : [profileForm.timezone, ...zones]
  }, [profileForm.timezone])

  const currencyOptions = useMemo(() => {
    const normalized = profileForm.paymentCurrency.toUpperCase()
    return CURRENCY_OPTIONS.some((option) => option.value === normalized)
      ? CURRENCY_OPTIONS
      : [{ value: profileForm.paymentCurrency, label: profileForm.paymentCurrency }, ...CURRENCY_OPTIONS]
  }, [profileForm.paymentCurrency])

  const [availability, setAvailability] = useState<BusinessAvailability[]>(() =>
    DAYS_OF_WEEK.map((_, dayOfWeek) => initialAvailability.find((a) => a.dayOfWeek === dayOfWeek) ?? defaultDay(dayOfWeek))
  )
  const [savingDay, setSavingDay] = useState<number | null>(null)

  const [closedDates, setClosedDates] = useState(initialClosedDates)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  const [stripe, setStripe] = useState(initialStripeStatus)
  const [stripeForm, setStripeForm] = useState({ publishableKey: stripe.publishableKey ?? '', secretKey: '' })
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [savingStripe, setSavingStripe] = useState(false)
  const [disconnectingStripe, setDisconnectingStripe] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaved(false)
    setSavingProfile(true)
    try {
      const supabase = createClient()
      await updateBusiness(supabase, business.id, {
        name: profileForm.name,
        phone: profileForm.phone.trim() || null,
        bookingEmail: profileForm.email.trim() || null,
        website: profileForm.website.trim() || null,
        address: profileForm.address.trim() || null,
        city: profileForm.city.trim() || null,
        state: profileForm.state.trim() || null,
        zipCode: profileForm.zipCode.trim() || null,
        timezone: profileForm.timezone,
        paymentCurrency: profileForm.paymentCurrency,
      })
      setProfileSaved(true)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveDay(day: BusinessAvailability) {
    setSavingDay(day.dayOfWeek)
    try {
      const supabase = createClient()
      const updated = await upsertBusinessAvailability(supabase, business.id, {
        dayOfWeek: day.dayOfWeek,
        isActive: day.isActive,
        openTime: day.openTime,
        closeTime: day.closeTime,
        breakStart: day.breakStart,
        breakEnd: day.breakEnd,
        slotMinutes: day.slotMinutes,
      })
      setAvailability((prev) => prev.map((d) => (d.dayOfWeek === day.dayOfWeek ? updated : d)))
    } finally {
      setSavingDay(null)
    }
  }

  function patchDay(dayOfWeek: number, patch: Partial<BusinessAvailability>) {
    setAvailability((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)))
  }

  async function handleAddClosedDate(e: React.FormEvent) {
    e.preventDefault()
    if (!newDate) return
    const supabase = createClient()
    const created = await addClosedDate(supabase, business.id, { blockedDate: newDate, reason: newReason.trim() || null })
    setClosedDates((prev) => [created as ClosedDateRow, ...prev.filter((d) => d.blocked_date !== newDate)])
    setNewDate('')
    setNewReason('')
  }

  async function handleRemoveClosedDate(blockedDate: string) {
    const supabase = createClient()
    await removeClosedDate(supabase, business.id, blockedDate)
    setClosedDates((prev) => prev.filter((d) => d.blocked_date !== blockedDate))
  }

  async function handleSaveStripe(e: React.FormEvent) {
    e.preventDefault()
    setStripeError(null)
    setSavingStripe(true)
    try {
      const response = await fetch('/api/business/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripeForm),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Could not save Stripe keys')
      }
      setStripe(body.stripe)
      setStripeForm((f) => ({ ...f, secretKey: '' }))
    } catch (err) {
      setStripeError(err instanceof Error ? err.message : 'Could not save Stripe keys')
    } finally {
      setSavingStripe(false)
    }
  }

  async function handleDisconnectStripe() {
    if (!window.confirm('Disconnect Stripe? Clients will only be able to pay in cash until you reconnect it.')) return
    setDisconnectingStripe(true)
    setStripeError(null)
    try {
      const response = await fetch('/api/business/stripe', { method: 'DELETE' })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Could not disconnect Stripe')
      }
      setStripe(body.stripe)
      setStripeForm({ publishableKey: '', secretKey: '' })
    } catch (err) {
      setStripeError(err instanceof Error ? err.message : 'Could not disconnect Stripe')
    } finally {
      setDisconnectingStripe(false)
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={<SectionEyebrow>Settings</SectionEyebrow>}
        title="Business profile and operations"
        description="How the clinic looks to patients, when it's open, and how it gets paid."
      />

      <Tabs
        items={[
          { label: 'Business Profile', value: 'profile' },
          { label: 'Hours', value: 'hours' },
          { label: 'Payments', value: 'payments' },
        ]}
        value={tab}
        onChange={(value) => setTab(value as 'profile' | 'hours' | 'payments')}
      />

      {tab === 'profile' ? (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <SurfaceCard className="p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Clinic identity</div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Name and contact details shown to patients.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel>Clinic name *</FieldLabel>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Phone</FieldLabel>
                <input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className="input-field w-full" />
              </div>
              <div className="space-y-2">
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel>Website</FieldLabel>
                <input
                  value={profileForm.website}
                  onChange={(e) => setProfileForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://"
                  className="input-field w-full"
                />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Clinic location</div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Physical address shown to patients.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <FieldLabel>Address</FieldLabel>
                <input value={profileForm.address} onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))} className="input-field w-full" />
              </div>
              <div className="space-y-2">
                <FieldLabel>City</FieldLabel>
                <input value={profileForm.city} onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))} className="input-field w-full" />
              </div>
              <div className="space-y-2">
                <FieldLabel>State / Province</FieldLabel>
                <input value={profileForm.state} onChange={(e) => setProfileForm((f) => ({ ...f, state: e.target.value }))} className="input-field w-full" />
              </div>
              <div className="space-y-2">
                <FieldLabel>Zip code</FieldLabel>
                <input value={profileForm.zipCode} onChange={(e) => setProfileForm((f) => ({ ...f, zipCode: e.target.value }))} className="input-field w-full" />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Regional settings</div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Timezone used for scheduling and the currency shown on prices and payments.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Timezone</FieldLabel>
                <select
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, timezone: e.target.value }))}
                  className="input-field w-full"
                >
                  {timezoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel>Currency</FieldLabel>
                <select
                  value={profileForm.paymentCurrency}
                  onChange={(e) => setProfileForm((f) => ({ ...f, paymentCurrency: e.target.value }))}
                  className="input-field w-full"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
              {profileSaved && (
                <span className="text-sm font-medium" style={{ color: 'var(--brand-strong)' }}>
                  Saved.
                </span>
              )}
            </div>
          </SurfaceCard>
        </form>
      ) : null}

      {tab === 'hours' ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <SurfaceCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Weekly schedule</div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">Open hours and breaks</h2>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {availability.map((day) => (
                <div key={day.dayOfWeek} className="border border-[var(--border-soft)] bg-[var(--panel-soft)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => patchDay(day.dayOfWeek, { isActive: !day.isActive })}
                        className="grid h-10 w-10 place-items-center text-white"
                        style={{ background: day.isActive ? 'var(--brand)' : 'var(--text-muted)' }}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <div>
                        <div className="text-sm font-bold text-[var(--text-strong)]">{DAYS_OF_WEEK[day.dayOfWeek]}</div>
                        {day.isActive ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                            <input type="time" value={day.openTime} onChange={(e) => patchDay(day.dayOfWeek, { openTime: e.target.value })} className="input-field !w-auto !py-1 !text-xs" />
                            <span>–</span>
                            <input type="time" value={day.closeTime} onChange={(e) => patchDay(day.dayOfWeek, { closeTime: e.target.value })} className="input-field !w-auto !py-1 !text-xs" />
                            <span>break</span>
                            <input type="time" value={day.breakStart ?? ''} onChange={(e) => patchDay(day.dayOfWeek, { breakStart: e.target.value || null })} className="input-field !w-auto !py-1 !text-xs" />
                            <span>–</span>
                            <input type="time" value={day.breakEnd ?? ''} onChange={(e) => patchDay(day.dayOfWeek, { breakEnd: e.target.value || null })} className="input-field !w-auto !py-1 !text-xs" />
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-[var(--text-muted)]">Closed</div>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => void handleSaveDay(day)} disabled={savingDay === day.dayOfWeek} className="btn-secondary !px-4 !py-2 !text-xs">
                      {savingDay === day.dayOfWeek ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Blocked dates</div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">Holiday and closure management</h2>
              </div>
              <StatusBadge tone={closedDates.length > 0 ? 'rose' : 'slate'}>{closedDates.length} blocked</StatusBadge>
            </div>
            <div className="mt-6 border border-[var(--border-soft)] bg-[var(--panel-soft)] p-5">
              <form onSubmit={handleAddClosedDate} className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr_auto]">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input-field w-full" required />
                <input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Reason (optional)" className="input-field w-full" />
                <button type="submit" className="btn-primary !px-4">
                  <Plus className="h-4 w-4" />
                  Block date
                </button>
              </form>
              <div className="mt-6 space-y-2">
                {closedDates.length === 0 && (
                  <div className="border border-dashed border-[var(--border-soft)] bg-[var(--panel)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    No dates blocked. Add a holiday or clinic closure above.
                  </div>
                )}
                {closedDates.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 border border-[var(--border-soft)] bg-[var(--panel)] px-4 py-3">
                    <div>
                      <div className="text-sm font-bold text-[var(--text-strong)]">{d.blocked_date}</div>
                      {d.reason && <div className="text-xs text-[var(--text-muted)]">{d.reason}</div>}
                    </div>
                    <button type="button" onClick={() => void handleRemoveClosedDate(d.blocked_date)} className="text-[var(--coral)]" aria-label="Remove blocked date">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {tab === 'payments' ? (
        <SurfaceCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgba(15,118,110,0.1)] text-[var(--brand-strong)]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Appointment payments</div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">Your Stripe account</h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Clients pay appointment deposits directly into your own Stripe account — this is separate from the USDC wallet payment
            option already configured under Business Profile.
          </p>

          <div className="mt-5 flex items-start gap-3 border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3">
            <StatusBadge tone={stripe.connected ? 'emerald' : 'amber'}>{stripe.connected ? 'Connected' : 'Not connected'}</StatusBadge>
            <p className="text-sm text-[var(--text-muted)]">
              {stripe.connected
                ? 'Card payments are enabled for this clinic. Paste new keys below to rotate them.'
                : 'Clients can only pay in cash until you connect Stripe. Enter your keys below to enable online payments.'}
            </p>
          </div>

          {stripeError ? (
            <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{stripeError}</div>
          ) : null}

          <form onSubmit={handleSaveStripe} className="mt-5 space-y-4">
            <div className="space-y-2">
              <FieldLabel>Publishable key (starts with pk_)</FieldLabel>
              <input
                value={stripeForm.publishableKey}
                onChange={(e) => setStripeForm((f) => ({ ...f, publishableKey: e.target.value }))}
                placeholder="pk_live_... or pk_test_..."
                className="input-field w-full font-mono text-sm"
                required
              />
              <p className="text-xs text-[var(--text-muted)]">Safe to share - this key is public.</p>
            </div>
            <div className="space-y-2">
              <FieldLabel>Secret key (starts with sk_)</FieldLabel>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={stripeForm.secretKey}
                  onChange={(e) => setStripeForm((f) => ({ ...f, secretKey: e.target.value }))}
                  placeholder={stripe.connected ? 'sk_•••••••••••••••••••• (leave blank to keep current key)' : 'sk_live_... or sk_test_...'}
                  className="input-field w-full pr-10 font-mono text-sm"
                  required={!stripe.connected}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-label={showSecretKey ? 'Hide secret key' : 'Show secret key'}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Stored encrypted. Never shared with clients. Only used server-side to create payment intents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-soft)] pt-4">
              <button type="submit" disabled={savingStripe} className="btn-primary">
                {savingStripe ? 'Saving…' : stripe.connected ? 'Update Stripe keys' : 'Connect Stripe'}
              </button>
              {stripe.connected ? (
                <button
                  type="button"
                  onClick={() => void handleDisconnectStripe()}
                  disabled={disconnectingStripe}
                  className="text-sm font-semibold text-[var(--coral)]"
                >
                  {disconnectingStripe ? 'Disconnecting…' : 'Disconnect'}
                </button>
              ) : null}
              <span className="text-xs text-[var(--text-muted)]">
                Get your keys at dashboard.stripe.com → Developers → API keys
              </span>
            </div>
          </form>
        </SurfaceCard>
      ) : null}
    </div>
  )
}

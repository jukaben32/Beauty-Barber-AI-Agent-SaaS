'use client'

import { useState } from 'react'
import { Globe2, UploadCloud, ExternalLink, Save, Rocket, EyeOff } from 'lucide-react'
import type { AiAgent, Service, Website } from '@/types'
import { SectionEyebrow, SurfaceCard, StatusBadge } from '@/components/dashboard/shared'

const TEMPLATES = [
  { id: 'serenity', name: 'Serenity', tagline: 'Soft gradients, calm hero, strong booking CTA' },
  { id: 'pulse', name: 'Pulse', tagline: 'More contrast, premium positioning' },
  { id: 'clarity', name: 'Clarity', tagline: 'Minimal, modern trust, less decoration' },
] as const

type FormState = {
  slug: string
  agentId: string
  template: Website['template']
  primaryColor: string
  secondaryColor: string
  font: string
  siteTitle: string
  siteDescription: string
  heroHeadline: string
  heroSubheadline: string
  heroImageUrl: string
  ctaPrimaryText: string
  ctaSecondaryText: string
  aboutTitle: string
  aboutStory: string
  aboutPhotoUrl: string
  footerTagline: string
  footerCopyright: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  contactHours: string
  yearsExperience: string
  clientsServed: string
  satisfactionPct: string
  trustBadgesText: string
}

function toForm(w: Website): FormState {
  return {
    slug: w.slug,
    agentId: w.agentId ?? '',
    template: w.template,
    primaryColor: w.primaryColor,
    secondaryColor: w.secondaryColor,
    font: w.font,
    siteTitle: w.siteTitle,
    siteDescription: w.siteDescription,
    heroHeadline: w.heroHeadline ?? '',
    heroSubheadline: w.heroSubheadline ?? '',
    heroImageUrl: w.heroImageUrl ?? '',
    ctaPrimaryText: w.ctaPrimaryText,
    ctaSecondaryText: w.ctaSecondaryText,
    aboutTitle: w.aboutTitle,
    aboutStory: w.aboutStory ?? '',
    aboutPhotoUrl: w.aboutPhotoUrl ?? '',
    footerTagline: w.footerTagline ?? '',
    footerCopyright: w.footerCopyright ?? '',
    contactPhone: w.contactPhone ?? '',
    contactEmail: w.contactEmail ?? '',
    contactAddress: w.contactAddress ?? '',
    contactHours: w.contactHours ?? '',
    yearsExperience: w.yearsExperience?.toString() ?? '',
    clientsServed: w.clientsServed?.toString() ?? '',
    satisfactionPct: w.satisfactionPct?.toString() ?? '',
    trustBadgesText: w.trustBadges.join('\n'),
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[var(--text-muted)]">{label}</label>
      {children}
    </div>
  )
}

export function WebsiteEditor({
  initialWebsite,
  services,
  agents,
  businessSlug,
}: {
  initialWebsite: Website
  services: Service[]
  agents: AiAgent[]
  businessSlug: string
}) {
  const [website, setWebsite] = useState(initialWebsite)
  const [form, setForm] = useState<FormState>(toForm(initialWebsite))
  const [featuredServiceIds, setFeaturedServiceIds] = useState<string[]>(initialWebsite.featuredServiceIds)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingAbout, setUploadingAbout] = useState(false)

  function patch(p: Partial<FormState>) {
    setForm((f) => ({ ...f, ...p }))
  }

  function toggleService(id: string) {
    setFeaturedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function uploadImage(file: File): Promise<string | null> {
    const body = new FormData()
    body.append('file', file)
    body.append('folder', 'website')
    const res = await fetch('/api/website/upload-image', { method: 'POST', body })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Upload failed')
    return data.url as string
  }

  async function handleHeroFile(file: File | undefined) {
    if (!file) return
    setUploadingHero(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      patch({ heroImageUrl: url ?? '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen')
    } finally {
      setUploadingHero(false)
    }
  }

  async function handleAboutFile(file: File | undefined) {
    if (!file) return
    setUploadingAbout(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      patch({ aboutPhotoUrl: url ?? '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen')
    } finally {
      setUploadingAbout(false)
    }
  }

  async function save(publishOverride?: boolean): Promise<boolean> {
    setSaving(true)
    setSaved(false)
    setError(null)

    const body = {
      slug: form.slug,
      agentId: form.agentId || null,
      template: form.template,
      published: publishOverride ?? website.published,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      font: form.font,
      siteTitle: form.siteTitle,
      siteDescription: form.siteDescription,
      heroHeadline: form.heroHeadline || null,
      heroSubheadline: form.heroSubheadline || null,
      heroImageUrl: form.heroImageUrl || null,
      ctaPrimaryText: form.ctaPrimaryText,
      ctaSecondaryText: form.ctaSecondaryText,
      aboutTitle: form.aboutTitle,
      aboutStory: form.aboutStory || null,
      aboutPhotoUrl: form.aboutPhotoUrl || null,
      footerTagline: form.footerTagline || null,
      footerCopyright: form.footerCopyright || null,
      contactPhone: form.contactPhone || null,
      contactEmail: form.contactEmail || null,
      contactAddress: form.contactAddress || null,
      contactHours: form.contactHours || null,
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
      clientsServed: form.clientsServed ? Number(form.clientsServed) : null,
      satisfactionPct: form.satisfactionPct ? Number(form.satisfactionPct) : null,
      trustBadges: form.trustBadgesText.split('\n').map((s) => s.trim()).filter(Boolean),
      featuredServiceIds,
    }

    const res = await fetch('/api/website/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'No se pudo guardar')
      return false
    }

    setWebsite(data.website)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    return true
  }

  // Publish always saves the current draft first — a Publish click that
  // redirects or bails without saving would lose everything just typed in,
  // the exact bug found and fixed in the sibling real-estate project's
  // Website Builder (commit 21a8fbb). There's no payment gate here
  // (website_builder_enabled defaults true for every business), so this is
  // simpler, but the save-before-state-change discipline still matters.
  async function handlePublishToggle() {
    await save(!website.published)
  }

  const siteUrl = typeof window !== 'undefined' ? `${window.location.origin}/sites/${website.slug}` : `/sites/${website.slug}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <Globe2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--text-strong)]">Website Builder</p>
            <p className="text-xs text-[var(--text-muted)]">
              {website.published ? `Live at /sites/${website.slug}` : 'Not published yet'}
            </p>
          </div>
          <StatusBadge tone={website.published ? 'emerald' : 'blue'}>{website.published ? 'Published' : 'Draft'}</StatusBadge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={siteUrl} target="_blank" rel="noreferrer" className="btn-secondary !px-3 !py-2 !text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            View live
          </a>
          <button type="button" onClick={() => save()} disabled={saving} className="btn-secondary !px-3 !py-2 !text-xs">
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
          <button type="button" onClick={handlePublishToggle} disabled={saving} className="btn-primary !px-3 !py-2 !text-xs">
            {website.published ? <EyeOff className="h-3.5 w-3.5" /> : <Rocket className="h-3.5 w-3.5" />}
            {website.published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-[var(--coral)]">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard className="space-y-4 p-6">
          <SectionEyebrow>Branding</SectionEyebrow>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => patch({ template: t.id })}
                className={`rounded-2xl border p-3 text-left transition ${
                  form.template === t.id ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/30' : 'border-[var(--border-soft)]'
                }`}
              >
                <p className="text-xs font-bold text-[var(--text-strong)]">{t.name}</p>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">{t.tagline}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary color">
              <input type="color" value={form.primaryColor} onChange={(e) => patch({ primaryColor: e.target.value })} className="h-10 w-full rounded-xl border border-[var(--border-soft)]" />
            </Field>
            <Field label="Secondary color">
              <input type="color" value={form.secondaryColor} onChange={(e) => patch({ secondaryColor: e.target.value })} className="h-10 w-full rounded-xl border border-[var(--border-soft)]" />
            </Field>
          </div>
          <Field label="Site URL">
            <div className="flex items-center gap-1">
              <span className="text-xs text-[var(--text-muted)]">/sites/</span>
              <input
                value={form.slug}
                onChange={(e) => patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="input-field flex-1"
              />
            </div>
          </Field>
          <Field label="AI Agent">
            <select value={form.agentId} onChange={(e) => patch({ agentId: e.target.value })} className="input-field w-full">
              <option value="">No agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.specialty ?? a.title ?? 'General'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Site title">
            <input value={form.siteTitle} onChange={(e) => patch({ siteTitle: e.target.value })} className="input-field w-full" />
          </Field>
          <Field label="Site description">
            <textarea value={form.siteDescription} onChange={(e) => patch({ siteDescription: e.target.value })} rows={3} className="input-field w-full" />
          </Field>
        </SurfaceCard>

        <SurfaceCard className="space-y-4 p-6">
          <SectionEyebrow>Hero section</SectionEyebrow>
          <Field label="Headline">
            <input value={form.heroHeadline} onChange={(e) => patch({ heroHeadline: e.target.value })} className="input-field w-full" placeholder="Advanced care you can trust" />
          </Field>
          <Field label="Subheadline">
            <textarea value={form.heroSubheadline} onChange={(e) => patch({ heroSubheadline: e.target.value })} rows={2} className="input-field w-full" />
          </Field>
          <Field label="Hero image">
            <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] p-4 text-center">
              {form.heroImageUrl ? (
                <span className="text-xs font-semibold text-[var(--brand)]">Change image</span>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5 text-[var(--brand)]" />
                  <span className="text-xs font-semibold text-[var(--brand)]">{uploadingHero ? 'Uploading…' : 'Click or drag to upload'}</span>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploadingHero} onChange={(e) => void handleHeroFile(e.target.files?.[0])} />
            </label>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA primary">
              <input value={form.ctaPrimaryText} onChange={(e) => patch({ ctaPrimaryText: e.target.value })} className="input-field w-full" />
            </Field>
            <Field label="CTA secondary">
              <input value={form.ctaSecondaryText} onChange={(e) => patch({ ctaSecondaryText: e.target.value })} className="input-field w-full" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Years exp.">
              <input value={form.yearsExperience} onChange={(e) => patch({ yearsExperience: e.target.value })} type="number" className="input-field w-full" />
            </Field>
            <Field label="Clients served">
              <input value={form.clientsServed} onChange={(e) => patch({ clientsServed: e.target.value })} type="number" className="input-field w-full" />
            </Field>
            <Field label="Satisfaction %">
              <input value={form.satisfactionPct} onChange={(e) => patch({ satisfactionPct: e.target.value })} type="number" className="input-field w-full" />
            </Field>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-4 p-6">
          <SectionEyebrow>About</SectionEyebrow>
          <Field label="About title">
            <input value={form.aboutTitle} onChange={(e) => patch({ aboutTitle: e.target.value })} className="input-field w-full" />
          </Field>
          <Field label="Story">
            <textarea value={form.aboutStory} onChange={(e) => patch({ aboutStory: e.target.value })} rows={4} className="input-field w-full" />
          </Field>
          <Field label="About photo">
            <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] p-4 text-center">
              {form.aboutPhotoUrl ? (
                <span className="text-xs font-semibold text-[var(--brand)]">Change photo</span>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5 text-[var(--brand)]" />
                  <span className="text-xs font-semibold text-[var(--brand)]">{uploadingAbout ? 'Uploading…' : 'Click or drag to upload'}</span>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploadingAbout} onChange={(e) => void handleAboutFile(e.target.files?.[0])} />
            </label>
          </Field>
          <Field label="Trust badges (one per line)">
            <textarea value={form.trustBadgesText} onChange={(e) => patch({ trustBadgesText: e.target.value })} rows={3} className="input-field w-full" />
          </Field>
        </SurfaceCard>

        <SurfaceCard className="space-y-4 p-6">
          <SectionEyebrow>Services &amp; contact</SectionEyebrow>
          <Field label="Featured services">
            <div className="flex flex-wrap gap-1.5">
              {services.length === 0 && <p className="text-xs text-[var(--text-muted)]">No services yet — add some in Services.</p>}
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`badge cursor-pointer border-transparent ${
                    featuredServiceIds.includes(s.id) ? 'bg-[var(--brand)] text-white' : 'bg-[var(--panel-soft)] text-[var(--text-muted)]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input value={form.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} className="input-field w-full" />
            </Field>
            <Field label="Email">
              <input value={form.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} className="input-field w-full" />
            </Field>
          </div>
          <Field label="Address">
            <input value={form.contactAddress} onChange={(e) => patch({ contactAddress: e.target.value })} className="input-field w-full" />
          </Field>
          <Field label="Hours">
            <input value={form.contactHours} onChange={(e) => patch({ contactHours: e.target.value })} className="input-field w-full" placeholder="Mon - Fri, 9:00 AM - 5:00 PM" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Footer tagline">
              <input value={form.footerTagline} onChange={(e) => patch({ footerTagline: e.target.value })} className="input-field w-full" />
            </Field>
            <Field label="Footer copyright">
              <input value={form.footerCopyright} onChange={(e) => patch({ footerCopyright: e.target.value })} className="input-field w-full" />
            </Field>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

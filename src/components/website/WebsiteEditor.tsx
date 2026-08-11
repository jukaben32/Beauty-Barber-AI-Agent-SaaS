'use client'

import { useMemo, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Building2,
  ChevronDown,
  ExternalLink,
  EyeOff,
  FileText,
  Globe2,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Key,
  Palette,
  Phone,
  Plus,
  Quote,
  Rocket,
  Save,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import type { AiAgent, WebsiteContent, WebsiteFaq, WebsiteService, WebsiteSpecialty, WebsiteTeamMember, WebsiteTestimonial } from '@/types'
import { StatusBadge, SurfaceCard } from '@/components/dashboard/shared'
import { WebsiteTemplateRenderer } from './WebsiteTemplateRenderer'
import { SOCIAL_PLATFORMS } from './socialLinks'

const TEMPLATE_CHOICES = [
  { id: 'serenity', name: 'Serenity', tagline: 'Soft gradients and calm trust' },
  { id: 'pulse', name: 'Pulse', tagline: 'Premium contrast and punchy CTA' },
  { id: 'clarity', name: 'Clarity', tagline: 'Minimal, clean, and modern' },
] as const

const FONT_CHOICES = [
  { id: 'inter', label: 'Inter' },
  { id: 'playfair', label: 'Playfair Display' },
  { id: 'poppins', label: 'Poppins' },
] as const

const SERVICE_ICON_CHOICES = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'clipboard', label: 'Clipboard', icon: FileText },
  { key: 'trending', label: 'Trend', icon: TrendingUp },
  { key: 'building', label: 'Building', icon: Building2 },
  { key: 'key', label: 'Key', icon: Key },
] as const

const RATING_CHOICES = [1, 2, 3, 4, 5] as const

type WebsiteModel = WebsiteContent['website']

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function textOrNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function createService(businessId: string): WebsiteService {
  const stamp = nowIso()
  return {
    id: createId(),
    businessId,
    icon: 'home',
    name: 'New service',
    description: null,
    duration: '30 min',
    price: '$0',
    sortOrder: 0,
    createdAt: stamp,
    updatedAt: stamp,
  }
}

function createTeamMember(businessId: string): WebsiteTeamMember {
  const stamp = nowIso()
  return {
    id: createId(),
    businessId,
    name: 'New team member',
    role: 'Role',
    bio: null,
    photoUrl: null,
    sortOrder: 0,
    createdAt: stamp,
    updatedAt: stamp,
  }
}

function createTestimonial(businessId: string): WebsiteTestimonial {
  const stamp = nowIso()
  return {
    id: createId(),
    businessId,
    quote: 'Client feedback goes here.',
    authorName: 'Client Name',
    authorRole: null,
    rating: 5,
    sortOrder: 0,
    createdAt: stamp,
    updatedAt: stamp,
  }
}

function createSpecialty(businessId: string): WebsiteSpecialty {
  return {
    id: createId(),
    businessId,
    label: 'New specialty',
    sortOrder: 0,
    createdAt: nowIso(),
  }
}

function createFaq(businessId: string): WebsiteFaq {
  return {
    id: createId(),
    businessId,
    question: 'New question?',
    answer: 'Answer goes here.',
    sortOrder: 0,
    createdAt: nowIso(),
  }
}

function Field({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      {children}
      {helper ? <div className="text-[11px] text-[var(--text-muted)]">{helper}</div> : null}
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string
  subtitle?: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,239,230,0.9))] shadow-sm"
    >
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-bold text-[var(--text-strong)]">{title}</div>
              {subtitle ? <div className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</div> : null}
            </div>
          </div>
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="border-t border-[var(--border-soft)] px-5 py-5">{children}</div>
    </details>
  )
}

function UploadBox({
  label,
  url,
  busy,
  hint,
  onPick,
  onClear,
}: {
  label: string
  url: string | null
  busy?: boolean
  hint?: string
  onPick: (file: File | undefined) => void
  onClear?: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-5 text-center transition hover:border-[var(--brand)]/60">
        <div
          className="grid h-20 w-full place-items-center overflow-hidden rounded-[20px] border border-[var(--border-soft)] bg-white/80"
          style={
            url
              ? {
                  backgroundImage: `url(${url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!url ? <ImageIcon className="h-6 w-6 text-[var(--brand)]" /> : null}
        </div>
        <div className="text-sm font-semibold text-[var(--brand)]">{busy ? 'Uploading...' : url ? 'Change image' : `Upload ${label.toLowerCase()}`}</div>
        {hint ? <div className="text-[11px] text-[var(--text-muted)]">{hint}</div> : null}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {url && onClear ? (
        <button type="button" onClick={onClear} className="text-xs font-medium text-[var(--text-muted)] underline">
          Remove image
        </button>
      ) : null}
    </div>
  )
}

export function WebsiteEditor({
  initialContent,
  agents,
  businessName,
}: {
  initialContent: WebsiteContent
  agents: AiAgent[]
  businessName: string
}) {
  const [website, setWebsite] = useState<WebsiteModel>(initialContent.website)
  const [services, setServices] = useState<WebsiteService[]>(initialContent.services)
  const [teamMembers, setTeamMembers] = useState<WebsiteTeamMember[]>(initialContent.teamMembers)
  const [testimonials, setTestimonials] = useState<WebsiteTestimonial[]>(initialContent.testimonials)
  const [specialties, setSpecialties] = useState<WebsiteSpecialty[]>(initialContent.specialties)
  const [faqs, setFaqs] = useState<WebsiteFaq[]>(initialContent.faqs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const [heroBusy, setHeroBusy] = useState(false)
  const [aboutBusy, setAboutBusy] = useState(false)
  const [teamPhotoIndex, setTeamPhotoIndex] = useState<number | null>(null)

  const livePath = `/sites/${website.slug}`
  const liveUrl = useMemo(() => (typeof window !== 'undefined' ? `${window.location.origin}${livePath}` : livePath), [livePath])

  const previewContent = useMemo<WebsiteContent>(
    () => ({
      website,
      services,
      teamMembers,
      testimonials,
      specialties,
      faqs,
    }),
    [website, services, teamMembers, testimonials, specialties, faqs]
  )

  function patchWebsite(patch: Partial<WebsiteModel>) {
    setWebsite((current) => ({ ...current, ...patch }))
  }

  function patchService(index: number, patch: Partial<WebsiteService>) {
    setServices((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function patchTeamMember(index: number, patch: Partial<WebsiteTeamMember>) {
    setTeamMembers((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function patchTestimonial(index: number, patch: Partial<WebsiteTestimonial>) {
    setTestimonials((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function patchSpecialty(index: number, patch: Partial<WebsiteSpecialty>) {
    setSpecialties((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function patchFaq(index: number, patch: Partial<WebsiteFaq>) {
    setFaqs((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function toggleFeaturedService(serviceId: string) {
    setWebsite((current) => ({
      ...current,
      featuredServiceIds: current.featuredServiceIds.includes(serviceId)
        ? current.featuredServiceIds.filter((id) => id !== serviceId)
        : [...current.featuredServiceIds, serviceId],
    }))
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return null
    const body = new FormData()
    body.append('file', file)
    body.append('folder', 'website')
    const res = await fetch('/api/website/upload-image', { method: 'POST', body })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error ?? 'No se pudo subir la imagen')
    }
    return data.url as string
  }

  async function handleLogoUpload(file: File | undefined) {
    if (!file) return
    setLogoBusy(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      patchWebsite({ logoUrl: url ?? null })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen')
    } finally {
      setLogoBusy(false)
    }
  }

  async function handleHeroUpload(file: File | undefined) {
    if (!file) return
    setHeroBusy(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      patchWebsite({ heroImageUrl: url ?? null })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen')
    } finally {
      setHeroBusy(false)
    }
  }

  async function handleAboutUpload(file: File | undefined) {
    if (!file) return
    setAboutBusy(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      patchWebsite({ aboutPhotoUrl: url ?? null })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen')
    } finally {
      setAboutBusy(false)
    }
  }

  async function handleTeamUpload(index: number, file: File | undefined) {
    if (!file) return
    setTeamPhotoIndex(index)
    setError(null)
    try {
      const url = await uploadImage(file)
      patchTeamMember(index, { photoUrl: url ?? null })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen')
    } finally {
      setTeamPhotoIndex(null)
    }
  }

  function addService() {
    setServices((current) => [...current, { ...createService(website.businessId), sortOrder: current.length }])
  }

  function addTeamMember() {
    setTeamMembers((current) => [...current, { ...createTeamMember(website.businessId), sortOrder: current.length }])
  }

  function addTestimonial() {
    setTestimonials((current) => [...current, { ...createTestimonial(website.businessId), sortOrder: current.length }])
  }

  function addSpecialty() {
    setSpecialties((current) => [...current, { ...createSpecialty(website.businessId), sortOrder: current.length }])
  }

  function addFaq() {
    setFaqs((current) => [...current, { ...createFaq(website.businessId), sortOrder: current.length }])
  }

  async function save(publishedOverride?: boolean) {
    setSaving(true)
    setSaved(false)
    setError(null)

    const body = {
      website: {
        slug: website.slug,
        agentId: website.agentId,
        template: website.template,
        published: publishedOverride ?? website.published,
        primaryColor: website.primaryColor,
        secondaryColor: website.secondaryColor,
        font: website.font,
        logoUrl: textOrNull(website.logoUrl ?? ''),
        siteTitle: website.siteTitle,
        siteDescription: website.siteDescription,
        heroHeadline: textOrNull(website.heroHeadline ?? ''),
        heroSubheadline: textOrNull(website.heroSubheadline ?? ''),
        heroImageUrl: textOrNull(website.heroImageUrl ?? ''),
        ctaPrimaryText: website.ctaPrimaryText,
        ctaSecondaryText: website.ctaSecondaryText,
        aboutTitle: website.aboutTitle,
        aboutStory: textOrNull(website.aboutStory ?? ''),
        aboutPhotoUrl: textOrNull(website.aboutPhotoUrl ?? ''),
        footerTagline: textOrNull(website.footerTagline ?? ''),
        footerCopyright: textOrNull(website.footerCopyright ?? ''),
        contactPhone: textOrNull(website.contactPhone ?? ''),
        contactEmail: textOrNull(website.contactEmail ?? ''),
        contactAddress: textOrNull(website.contactAddress ?? ''),
        contactHours: textOrNull(website.contactHours ?? ''),
        contactMapsUrl: textOrNull(website.contactMapsUrl ?? ''),
        yearsExperience: website.yearsExperience,
        clientsServed: website.clientsServed,
        satisfactionPct: website.satisfactionPct,
        trustBadges: website.trustBadges.map((item) => item.trim()).filter(Boolean),
        featuredServiceIds: website.featuredServiceIds,
        socialYoutube: textOrNull(website.socialYoutube ?? ''),
        socialFacebook: textOrNull(website.socialFacebook ?? ''),
        socialInstagram: textOrNull(website.socialInstagram ?? ''),
        socialTiktok: textOrNull(website.socialTiktok ?? ''),
        socialLinkedin: textOrNull(website.socialLinkedin ?? ''),
        socialPinterest: textOrNull(website.socialPinterest ?? ''),
      },
      services: services.map((service, index) => ({
        id: service.id,
        icon: service.icon,
        name: service.name,
        description: textOrNull(service.description ?? ''),
        duration: textOrNull(service.duration ?? ''),
        price: textOrNull(service.price ?? ''),
        sortOrder: index,
      })),
      teamMembers: teamMembers.map((member, index) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        bio: textOrNull(member.bio ?? ''),
        photoUrl: textOrNull(member.photoUrl ?? ''),
        sortOrder: index,
      })),
      testimonials: testimonials.map((testimonial, index) => ({
        id: testimonial.id,
        quote: testimonial.quote,
        authorName: testimonial.authorName,
        authorRole: textOrNull(testimonial.authorRole ?? ''),
        rating: testimonial.rating,
        sortOrder: index,
      })),
      specialties: specialties.map((specialty, index) => ({
        id: specialty.id,
        label: specialty.label,
        sortOrder: index,
      })),
      faqs: faqs.map((faq, index) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: index,
      })),
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

    const next: WebsiteContent = data
    setWebsite(next.website)
    setServices(next.services)
    setTeamMembers(next.teamMembers)
    setTestimonials(next.testimonials)
    setSpecialties(next.specialties)
    setFaqs(next.faqs)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    return true
  }

  async function togglePublish() {
    await save(!website.published)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <Globe2 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-bold text-[var(--text-strong)]">Website Builder</div>
            <div className="text-xs text-[var(--text-muted)]">{businessName}</div>
          </div>
          <StatusBadge tone={website.published ? 'emerald' : 'blue'}>{website.published ? 'Published' : 'Draft'}</StatusBadge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary !px-3 !py-2 !text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            View live
          </a>
          <button type="button" onClick={() => void save()} disabled={saving} className="btn-secondary !px-3 !py-2 !text-xs">
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
          <button type="button" onClick={() => void togglePublish()} disabled={saving} className="btn-primary !px-3 !py-2 !text-xs">
            {website.published ? <EyeOff className="h-3.5 w-3.5" /> : <Rocket className="h-3.5 w-3.5" />}
            {website.published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-[var(--coral)]">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="space-y-5">
          <SectionCard
            title="Brand and basics"
            subtitle="Logo, template, colors, domain slug, AI agent, title, and description."
            icon={Palette}
          >
            <div className="grid gap-4">
              <UploadBox
                label="Logo - 1:1 recommended"
                url={website.logoUrl}
                busy={logoBusy}
                hint="Shown in the site header next to the business name."
                onPick={(file) => void handleLogoUpload(file)}
                onClear={() => patchWebsite({ logoUrl: null })}
              />

              <div className="grid gap-3 md:grid-cols-3">
                {TEMPLATE_CHOICES.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => patchWebsite({ template: choice.id })}
                    className={`rounded-[22px] border p-3 text-left transition ${
                      website.template === choice.id ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/25' : 'border-[var(--border-soft)]'
                    }`}
                  >
                    <div className="text-sm font-bold text-[var(--text-strong)]">{choice.name}</div>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)]">{choice.tagline}</div>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primary color">
                  <input
                    type="color"
                    value={website.primaryColor}
                    onChange={(e) => patchWebsite({ primaryColor: e.target.value })}
                    className="h-10 w-full rounded-xl border border-[var(--border-soft)]"
                  />
                </Field>
                <Field label="Secondary color">
                  <input
                    type="color"
                    value={website.secondaryColor}
                    onChange={(e) => patchWebsite({ secondaryColor: e.target.value })}
                    className="h-10 w-full rounded-xl border border-[var(--border-soft)]"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Font">
                  <select value={website.font} onChange={(e) => patchWebsite({ font: e.target.value })} className="input-field w-full">
                    {FONT_CHOICES.map((choice) => (
                      <option key={choice.id} value={choice.id}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="AI agent">
                  <select
                    value={website.agentId ?? ''}
                    onChange={(e) => patchWebsite({ agentId: e.target.value || null })}
                    className="input-field w-full"
                  >
                    <option value="">No agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} - {agent.specialty ?? agent.title ?? 'General'}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Site slug" helper="This becomes the public URL path.">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">/sites/</span>
                  <input
                    value={website.slug}
                    onChange={(e) => patchWebsite({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="input-field w-full"
                  />
                </div>
              </Field>

              <Field label="Site title">
                <input value={website.siteTitle} onChange={(e) => patchWebsite({ siteTitle: e.target.value })} className="input-field w-full" />
              </Field>

              <Field label="Site description">
                <textarea
                  value={website.siteDescription}
                  onChange={(e) => patchWebsite({ siteDescription: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Hero" subtitle="Headline, subheadline, hero image, and CTAs." icon={Sparkles}>
            <div className="grid gap-4">
              <Field label="Headline">
                <input
                  value={website.heroHeadline ?? ''}
                  onChange={(e) => patchWebsite({ heroHeadline: e.target.value })}
                  className="input-field w-full"
                  placeholder="Beauty and grooming that feels premium and personal"
                />
              </Field>

              <Field label="Subheadline">
                <textarea
                  value={website.heroSubheadline ?? ''}
                  onChange={(e) => patchWebsite({ heroSubheadline: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                  placeholder="Short supporting paragraph for the hero section."
                />
              </Field>

              <UploadBox
                label="Hero image"
                url={website.heroImageUrl}
                busy={heroBusy}
                hint="Upload a portrait, office shot, or hero illustration."
                onPick={(file) => void handleHeroUpload(file)}
                onClear={() => patchWebsite({ heroImageUrl: null })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Primary CTA">
                  <input value={website.ctaPrimaryText} onChange={(e) => patchWebsite({ ctaPrimaryText: e.target.value })} className="input-field w-full" />
                </Field>
                <Field label="Secondary CTA">
                  <input value={website.ctaSecondaryText} onChange={(e) => patchWebsite({ ctaSecondaryText: e.target.value })} className="input-field w-full" />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="About and metrics" subtitle="Story, image, trust badges, and proof points." icon={FileText}>
            <div className="grid gap-4">
              <Field label="About title">
                <input value={website.aboutTitle} onChange={(e) => patchWebsite({ aboutTitle: e.target.value })} className="input-field w-full" />
              </Field>

              <Field label="About story">
                <textarea
                  value={website.aboutStory ?? ''}
                  onChange={(e) => patchWebsite({ aboutStory: e.target.value })}
                  className="input-field w-full"
                  rows={4}
                  placeholder="Tell the salon's story and how the team helps clients look and feel their best."
                />
              </Field>

              <UploadBox
                label="About photo"
                url={website.aboutPhotoUrl}
                busy={aboutBusy}
                hint="This can be the owner, storefront exterior, or the team."
                onPick={(file) => void handleAboutUpload(file)}
                onClear={() => patchWebsite({ aboutPhotoUrl: null })}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Years exp.">
                  <input
                    type="number"
                    value={website.yearsExperience ?? ''}
                    onChange={(e) => patchWebsite({ yearsExperience: e.target.value === '' ? null : Number(e.target.value) })}
                    className="input-field w-full"
                  />
                </Field>
                <Field label="Clients served">
                  <input
                    type="number"
                    value={website.clientsServed ?? ''}
                    onChange={(e) => patchWebsite({ clientsServed: e.target.value === '' ? null : Number(e.target.value) })}
                    className="input-field w-full"
                  />
                </Field>
                <Field label="Satisfaction %">
                  <input
                    type="number"
                    value={website.satisfactionPct ?? ''}
                    onChange={(e) => patchWebsite({ satisfactionPct: e.target.value === '' ? null : Number(e.target.value) })}
                    className="input-field w-full"
                  />
                </Field>
              </div>

              <Field label="Trust badges" helper="One per line, shown as bullets on the live site.">
                <textarea
                  value={website.trustBadges.join('\n')}
                  onChange={(e) => patchWebsite({ trustBadges: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}
                  className="input-field w-full"
                  rows={4}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Services" subtitle="These populate the services section and featured service chips." icon={Briefcase}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-muted)]">{services.length} services in the catalog</p>
              <button type="button" onClick={addService} className="btn-secondary !px-3 !py-2 !text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add service
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {services.map((service, index) => {
                const featured = website.featuredServiceIds.includes(service.id)
                return (
                  <div key={service.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/75 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={service.icon}
                          onChange={(e) => patchService(index, { icon: e.target.value })}
                          className="input-field w-36"
                        >
                          {SERVICE_ICON_CHOICES.map((choice) => (
                            <option key={choice.key} value={choice.key}>
                              {choice.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => toggleFeaturedService(service.id)}
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            featured
                              ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                              : 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]'
                          }`}
                        >
                          {featured ? 'Featured' : 'Feature'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setServices((current) => moveItem(current, index, index - 1))}
                          disabled={index === 0}
                          className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                          aria-label="Move service up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setServices((current) => moveItem(current, index, index + 1))}
                          disabled={index === services.length - 1}
                          className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                          aria-label="Move service down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setServices((current) => current.filter((_, i) => i !== index))
                            setWebsite((current) => ({
                              ...current,
                              featuredServiceIds: current.featuredServiceIds.filter((id) => id !== service.id),
                            }))
                          }}
                          className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--coral)]"
                          aria-label="Remove service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Field label="Service name">
                        <input value={service.name} onChange={(e) => patchService(index, { name: e.target.value })} className="input-field w-full" />
                      </Field>
                      <Field label="Duration">
                        <input value={service.duration ?? ''} onChange={(e) => patchService(index, { duration: e.target.value })} className="input-field w-full" />
                      </Field>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Field label="Price">
                        <input value={service.price ?? ''} onChange={(e) => patchService(index, { price: e.target.value })} className="input-field w-full" />
                      </Field>
                      <Field label="Description">
                        <input
                          value={service.description ?? ''}
                          onChange={(e) => patchService(index, { description: e.target.value })}
                          className="input-field w-full"
                        />
                      </Field>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Team" subtitle="Stylist and staff cards shown in the live site." icon={UsersRound}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-muted)]">{teamMembers.length} team members</p>
              <button type="button" onClick={addTeamMember} className="btn-secondary !px-3 !py-2 !text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add team member
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/75 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-bold text-[var(--text-strong)]">Team member {index + 1}</div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTeamMembers((current) => moveItem(current, index, index - 1))}
                        disabled={index === 0}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move team member up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeamMembers((current) => moveItem(current, index, index + 1))}
                        disabled={index === teamMembers.length - 1}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move team member down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeamMembers((current) => current.filter((_, i) => i !== index))}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--coral)]"
                        aria-label="Remove team member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
                    <UploadBox
                      label="Photo"
                      url={member.photoUrl}
                      busy={teamPhotoIndex === index}
                      hint="Optional portrait for the team section."
                      onPick={(file) => void handleTeamUpload(index, file)}
                      onClear={() => patchTeamMember(index, { photoUrl: null })}
                    />

                    <div className="space-y-3">
                      <Field label="Name">
                        <input value={member.name} onChange={(e) => patchTeamMember(index, { name: e.target.value })} className="input-field w-full" />
                      </Field>
                      <Field label="Role">
                        <input value={member.role} onChange={(e) => patchTeamMember(index, { role: e.target.value })} className="input-field w-full" />
                      </Field>
                      <Field label="Bio">
                        <textarea value={member.bio ?? ''} onChange={(e) => patchTeamMember(index, { bio: e.target.value })} className="input-field w-full" rows={4} />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Testimonials" subtitle="Short client quotes and star ratings." icon={Quote}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-muted)]">{testimonials.length} testimonials</p>
              <button type="button" onClick={addTestimonial} className="btn-secondary !px-3 !py-2 !text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add testimonial
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/75 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-bold text-[var(--text-strong)]">Testimonial {index + 1}</div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTestimonials((current) => moveItem(current, index, index - 1))}
                        disabled={index === 0}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move testimonial up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestimonials((current) => moveItem(current, index, index + 1))}
                        disabled={index === testimonials.length - 1}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move testimonial down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestimonials((current) => current.filter((_, i) => i !== index))}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--coral)]"
                        aria-label="Remove testimonial"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Field label="Quote">
                    <textarea value={testimonial.quote} onChange={(e) => patchTestimonial(index, { quote: e.target.value })} className="input-field w-full" rows={3} />
                  </Field>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Author">
                      <input value={testimonial.authorName} onChange={(e) => patchTestimonial(index, { authorName: e.target.value })} className="input-field w-full" />
                    </Field>
                    <Field label="Role">
                      <input
                        value={testimonial.authorRole ?? ''}
                        onChange={(e) => patchTestimonial(index, { authorRole: e.target.value })}
                        className="input-field w-full"
                      />
                    </Field>
                  </div>

                  <Field label="Rating">
                    <div className="mt-1 flex flex-wrap gap-2">
                      {RATING_CHOICES.map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => patchTestimonial(index, { rating })}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            testimonial.rating === rating
                              ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                              : 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]'
                          }`}
                        >
                          {rating} star{rating === 1 ? '' : 's'}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Specialties" subtitle="These become the pill chips on the live page." icon={HelpCircle}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-muted)]">{specialties.length} specialty chips</p>
              <button type="button" onClick={addSpecialty} className="btn-secondary !px-3 !py-2 !text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add specialty
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {specialties.map((specialty, index) => (
                <div key={specialty.id} className="rounded-[22px] border border-[var(--border-soft)] bg-white/75 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-[var(--text-strong)]">Specialty {index + 1}</div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSpecialties((current) => moveItem(current, index, index - 1))}
                        disabled={index === 0}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move specialty up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecialties((current) => moveItem(current, index, index + 1))}
                        disabled={index === specialties.length - 1}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move specialty down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecialties((current) => current.filter((_, i) => i !== index))}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--coral)]"
                        aria-label="Remove specialty"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Field label="Label">
                      <input value={specialty.label} onChange={(e) => patchSpecialty(index, { label: e.target.value })} className="input-field w-full" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="FAQ" subtitle="Questions and answers shown in the accordion." icon={HelpCircle}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--text-muted)]">{faqs.length} FAQ entries</p>
              <button type="button" onClick={addFaq} className="btn-secondary !px-3 !py-2 !text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add FAQ
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="rounded-[24px] border border-[var(--border-soft)] bg-white/75 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-bold text-[var(--text-strong)]">FAQ {index + 1}</div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFaqs((current) => moveItem(current, index, index - 1))}
                        disabled={index === 0}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move FAQ up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFaqs((current) => moveItem(current, index, index + 1))}
                        disabled={index === faqs.length - 1}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-muted)] disabled:opacity-40"
                        aria-label="Move FAQ down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFaqs((current) => current.filter((_, i) => i !== index))}
                        className="rounded-full border border-[var(--border-soft)] p-2 text-[var(--coral)]"
                        aria-label="Remove FAQ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    <Field label="Question">
                      <input value={faq.question} onChange={(e) => patchFaq(index, { question: e.target.value })} className="input-field w-full" />
                    </Field>
                    <Field label="Answer">
                      <textarea value={faq.answer} onChange={(e) => patchFaq(index, { answer: e.target.value })} className="input-field w-full" rows={4} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Social media" subtitle="Síguenos en nuestras redes sociales - shown as icons in the site footer." icon={Share2}>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon
                return (
                  <Field key={platform.field} label={platform.label}>
                    <div className="flex items-center gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-strong)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <input
                        value={website[platform.field] ?? ''}
                        onChange={(e) => patchWebsite({ [platform.field]: e.target.value || null })}
                        placeholder={`https://${platform.label.toLowerCase()}.com/yoursalon`}
                        className="input-field w-full"
                      />
                    </div>
                  </Field>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Contact and footer" subtitle="Phone, email, address, maps, and footer copy." icon={Phone}>
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Phone">
                  <input value={website.contactPhone ?? ''} onChange={(e) => patchWebsite({ contactPhone: e.target.value })} className="input-field w-full" />
                </Field>
                <Field label="Email">
                  <input value={website.contactEmail ?? ''} onChange={(e) => patchWebsite({ contactEmail: e.target.value })} className="input-field w-full" />
                </Field>
              </div>

              <Field label="Address">
                <input value={website.contactAddress ?? ''} onChange={(e) => patchWebsite({ contactAddress: e.target.value })} className="input-field w-full" />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Hours">
                  <input value={website.contactHours ?? ''} onChange={(e) => patchWebsite({ contactHours: e.target.value })} className="input-field w-full" />
                </Field>
                <Field label="Maps URL">
                  <input value={website.contactMapsUrl ?? ''} onChange={(e) => patchWebsite({ contactMapsUrl: e.target.value })} className="input-field w-full" />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Footer tagline">
                  <input value={website.footerTagline ?? ''} onChange={(e) => patchWebsite({ footerTagline: e.target.value })} className="input-field w-full" />
                </Field>
                <Field label="Footer copyright">
                  <input value={website.footerCopyright ?? ''} onChange={(e) => patchWebsite({ footerCopyright: e.target.value })} className="input-field w-full" />
                </Field>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="lg:sticky lg:top-6 h-fit">
          <SurfaceCard className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-soft)] px-5 py-4">
              <div>
                <div className="text-sm font-bold text-[var(--text-strong)]">Live preview</div>
                <div className="text-xs text-[var(--text-muted)]">The site updates as you edit this panel.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
                  /sites/{website.slug}
                </span>
                <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary !px-3 !py-2 !text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
              </div>
            </div>
            <div id="website-preview" className="max-h-[calc(100vh-11rem)] overflow-auto bg-[#f3efe7]">
              <WebsiteTemplateRenderer
                businessName={businessName}
                businessPhone={website.contactPhone}
                content={previewContent}
                isEditorPreview
              />
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  )
}

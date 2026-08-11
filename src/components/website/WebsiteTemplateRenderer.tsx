'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  HeartPulse,
  Home,
  Key,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Star,
  Stethoscope,
  UsersRound,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'

import type { WebsiteContent } from '@/types'
import { SurfaceCard } from '@/components/clinic/shared'
import { configuredSocialLinks } from './socialLinks'

const TEMPLATE_STYLES: Record<
  string,
  { bg: string; cardBg: string; text: string; subtext: string; border: string; heroBg: string }
> = {
  clarity: {
    bg: '#fbfbf8',
    cardBg: '#ffffff',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#e2e8f0',
    heroBg: '#ffffff',
  },
  pulse: {
    bg: '#071318',
    cardBg: '#10222a',
    text: '#f8fafc',
    subtext: '#94a3b8',
    border: '#1a3844',
    heroBg: '#071318',
  },
  serenity: {
    bg: '#f7f1e8',
    cardBg: '#fffdf9',
    text: '#1f2937',
    subtext: '#6b7280',
    border: '#eadfcd',
    heroBg: '#f7f1e8',
  },
}

const FONT_STACKS: Record<string, string> = {
  inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
  'playfair display': '"Playfair Display", Georgia, "Times New Roman", serif',
  playfair: '"Playfair Display", Georgia, "Times New Roman", serif',
  poppins: 'Poppins, ui-sans-serif, system-ui, sans-serif',
}

const FONT_LINKS: Record<string, string> = {
  inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'playfair display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap',
  playfair: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap',
  poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
}

const DEFAULT_HIGHLIGHTS = [
  'Same-week appointments',
  'Telehealth available',
  'Insurance-friendly care',
  'Compassionate follow-up',
]

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  clipboard: ClipboardList,
  trending: TrendingUp,
  building: Building2,
  key: Key,
}

function normalizeFont(font: string) {
  return font.trim().toLowerCase()
}

function toDecimalDegrees(degrees: string, minutes = '0', seconds = '0', direction: string) {
  const value = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600
  return /[SW]/i.test(direction) ? -value : value
}

function normalizeMapEmbedUrl(rawValue: string | null) {
  const value = rawValue?.trim()
  if (!value) return null

  const iframeSrc = value.match(/src=["']([^"']+)["']/i)?.[1]
  const input = (iframeSrc ?? value).trim()
  const dms = input.match(
    /(\d+(?:\.\d+)?)[^0-9NSEW]+(\d+(?:\.\d+)?)?[^0-9NSEW]*(\d+(?:\.\d+)?)?[^0-9NSEW]*([NS])[^0-9NSEW]+(\d+(?:\.\d+)?)[^0-9NSEW]+(\d+(?:\.\d+)?)?[^0-9NSEW]*(\d+(?:\.\d+)?)?[^0-9NSEW]*([EW])/i
  )
  const query = dms
    ? `${toDecimalDegrees(dms[1], dms[2], dms[3], dms[4])},${toDecimalDegrees(dms[5], dms[6], dms[7], dms[8])}`
    : input

  if (/^https?:\/\//i.test(query)) {
    try {
      const url = new URL(query)
      const host = url.hostname.toLowerCase()
      const isGoogleMap = host.includes('google.') || host === 'maps.app.goo.gl' || host === 'goo.gl'
      const isEmbed = url.pathname.includes('/maps/embed') || url.searchParams.get('output') === 'embed'
      if (isGoogleMap && isEmbed) return query
      if (!isGoogleMap) return query
    } catch {
      // Fall back to a Google Maps search embed below.
    }
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <SurfaceCard className="px-5 py-4" style={{ borderColor: accent }}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-[-0.05em]" style={{ color: accent }}>
        {value}
      </div>
    </SurfaceCard>
  )
}

function SectionTitle({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string
  title: string
  description?: string
  center?: boolean
}) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: 'var(--brand)' }}>
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-sm leading-7 sm:text-base" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      ) : null}
    </div>
  )
}

function SectionBlock({
  children,
  id,
  bg,
}: {
  children: ReactNode
  id?: string
  bg?: string
}) {
  return (
    <section id={id} className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  )
}

export function WebsiteTemplateRenderer({
  businessName,
  businessPhone,
  content,
  isEditorPreview = false,
}: {
  businessName: string
  businessPhone?: string | null
  content: WebsiteContent
  isEditorPreview?: boolean
}) {
  const { website, services, teamMembers, testimonials, specialties, faqs } = content
  const style = TEMPLATE_STYLES[website.template] ?? TEMPLATE_STYLES.clarity
  const fontKey = normalizeFont(website.font)
  const fontFamily = FONT_STACKS[fontKey] ?? FONT_STACKS.inter
  const fontLink = FONT_LINKS[fontKey] ?? FONT_LINKS.inter
  const mapEmbedUrl = normalizeMapEmbedUrl(website.contactMapsUrl)
  const heroTitle = website.heroHeadline || website.siteTitle || businessName
  const heroBody = website.heroSubheadline || website.siteDescription
  const phone = website.contactPhone || businessPhone || ''
  const featuredIds = new Set(website.featuredServiceIds)
  const fallbackHighlights = website.trustBadges.length > 0 ? website.trustBadges : DEFAULT_HIGHLIGHTS
  const socialLinks = configuredSocialLinks(website)

  return (
    <div style={{ backgroundColor: style.bg, color: style.text, fontFamily }} className="min-h-full">
      <link rel="stylesheet" href={fontLink} />

      <header className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ backgroundColor: `${style.bg}ee`, borderColor: style.border }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {website.logoUrl ? (
              <img src={website.logoUrl} alt={website.siteTitle || businessName} className="h-10 w-10 rounded-2xl object-cover shadow-lg" />
            ) : (
              <span
                className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${website.primaryColor}, ${website.secondaryColor})` }}
              >
                <HeartPulse className="h-5 w-5" />
              </span>
            )}
            <div>
              <p className="text-sm font-extrabold tracking-[-0.03em]">{website.siteTitle || businessName}</p>
              <p className="text-[11px] uppercase tracking-[0.26em]" style={{ color: style.subtext }}>
                {website.aboutTitle || 'Healthcare site'}
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex" style={{ color: style.subtext }}>
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#team">Team</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </nav>

          <a
            href={phone ? `tel:${phone}` : '#contact'}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${website.primaryColor}, ${website.secondaryColor})` }}
          >
            <Phone className="h-4 w-4" />
            {phone || 'Call us'}
          </a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: `radial-gradient(circle at top right, ${website.secondaryColor}25, transparent 35%),
                           radial-gradient(circle at left bottom, ${website.primaryColor}18, transparent 30%)`,
            }}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]"
                style={{ borderColor: style.border, color: website.primaryColor, backgroundColor: style.cardBg }}
              >
                <SparkleBadge />
                Modern patient experience
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-5xl xl:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 sm:text-lg" style={{ color: style.subtext }}>
                {heroBody}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${website.primaryColor}, ${website.secondaryColor})` }}
                >
                  {website.ctaPrimaryText}
                  <CalendarDays className="h-4 w-4" />
                </a>
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
                  style={{ borderColor: style.border, backgroundColor: style.cardBg }}
                >
                  {website.ctaSecondaryText}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Years experience" value={String(website.yearsExperience ?? 0)} accent={website.primaryColor} />
                <StatCard label="Patients served" value={String(website.patientsServed ?? 0)} accent={website.primaryColor} />
                <StatCard
                  label="Satisfaction"
                  value={website.satisfactionPct != null ? `${Math.round(website.satisfactionPct)}%` : '—'}
                  accent={website.secondaryColor}
                />
                <StatCard label="Services" value={String(services.length)} accent={website.primaryColor} />
              </div>
            </div>

            <div className="relative">
              <div
                className="overflow-hidden rounded-[32px] border shadow-[0_30px_80px_-48px_rgba(15,23,42,0.45)]"
                style={{ borderColor: style.border, backgroundColor: style.cardBg }}
              >
                <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: style.border }}>
                  <div>
                    <p className="text-sm font-bold">Overview</p>
                    <p className="text-xs" style={{ color: style.subtext }}>
                      Practice performance at a glance
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${website.primaryColor}, ${website.secondaryColor})` }}
                  >
                    Live
                  </span>
                </div>
                <div className="p-5">
                  <div
                    className="overflow-hidden rounded-[26px] border"
                    style={{ borderColor: style.border, backgroundColor: style.heroBg }}
                  >
                    <div className="grid min-h-[280px] place-items-center p-6 text-center">
                      {website.heroImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={website.heroImageUrl} alt="" className="h-full w-full rounded-[20px] object-cover" />
                      ) : isEditorPreview ? (
                        <div>
                          <Stethoscope className="mx-auto h-10 w-10 opacity-40" />
                          <p className="mt-3 text-sm" style={{ color: style.subtext }}>
                            Upload a hero image in the editor
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -right-2 -top-4 hidden rounded-2xl border px-4 py-3 shadow-xl lg:block"
                style={{ borderColor: style.border, backgroundColor: style.cardBg }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: style.subtext }}>
                  Current status
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: website.primaryColor }}>
                  {website.published ? 'Published' : 'Draft'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {services.length > 0 && (
          <SectionBlock id="services">
            <SectionTitle
              eyebrow="Services"
              title="How we help patients"
              description="The same clean, high-trust layout the reference uses, but tailored to clinical care and patient booking."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const Icon = SERVICE_ICONS[service.icon] ?? Home
                const featured = featuredIds.has(service.id)
                return (
                  <SurfaceCard key={service.id} className="p-5" style={{ backgroundColor: style.cardBg, borderColor: style.border }}>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                        style={{ background: `linear-gradient(135deg, ${website.primaryColor}, ${website.secondaryColor})` }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      {featured ? (
                        <span
                          className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
                          style={{ borderColor: style.border, color: website.primaryColor }}
                        >
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-lg font-bold tracking-[-0.03em]">{service.name}</h3>
                    {service.description ? (
                      <p className="mt-2 text-sm leading-7" style={{ color: style.subtext }}>
                        {service.description}
                      </p>
                    ) : null}
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span style={{ color: style.subtext }}>{service.duration || '—'}</span>
                      <span className="font-semibold" style={{ color: website.primaryColor }}>
                        {service.price || ''}
                      </span>
                    </div>
                  </SurfaceCard>
                )
              })}
            </div>
          </SectionBlock>
        )}

        <SectionBlock id="about" bg={style.cardBg}>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <SectionTitle
                eyebrow="About"
                title={website.aboutTitle || 'About the clinic'}
                description={website.aboutStory || website.siteDescription}
              />
              <div className="mt-8 space-y-3">
                {fallbackHighlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: website.primaryColor }} />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="overflow-hidden rounded-[32px] border shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]"
              style={{ borderColor: style.border, backgroundColor: style.bg }}
            >
              {website.aboutPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={website.aboutPhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid min-h-[320px] place-items-center p-8 text-center">
                  <FileText className="h-10 w-10 opacity-30" />
                  <p className="mt-3 text-sm" style={{ color: style.subtext }}>
                    Add an about photo to complete the section
                  </p>
                </div>
              )}
            </div>
          </div>
        </SectionBlock>

        {teamMembers.length > 0 && (
          <SectionBlock id="team">
            <SectionTitle
              eyebrow="Team"
              title="Meet the people behind the care"
              description="A polished staff section makes the clinic feel established and trustworthy."
              center
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member) => (
                <SurfaceCard key={member.id} className="p-5 text-center" style={{ backgroundColor: style.cardBg, borderColor: style.border }}>
                  <div
                    className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full text-2xl font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${website.primaryColor}, ${website.secondaryColor})` }}
                  >
                    {member.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      member.name.charAt(0).toUpperCase() || 'A'
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{member.name}</h3>
                  <p className="text-sm font-semibold" style={{ color: website.primaryColor }}>
                    {member.role}
                  </p>
                  {member.bio ? (
                    <p className="mt-3 text-sm leading-7" style={{ color: style.subtext }}>
                      {member.bio}
                    </p>
                  ) : null}
                </SurfaceCard>
              ))}
            </div>
          </SectionBlock>
        )}

        {testimonials.length > 0 && (
          <SectionBlock bg={style.cardBg}>
            <SectionTitle
              eyebrow="Testimonials"
              title="What patients say"
              description="Short quotes and ratings add trust, just like in the reference design."
              center
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <SurfaceCard key={testimonial.id} className="p-6" style={{ backgroundColor: style.bg, borderColor: style.border }}>
                  <div className="flex gap-0.5" style={{ color: website.secondaryColor }}>
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7">&quot;{testimonial.quote}&quot;</p>
                  <div className="mt-5 text-sm font-bold">{testimonial.authorName}</div>
                  {testimonial.authorRole ? (
                    <div className="text-xs uppercase tracking-[0.2em]" style={{ color: style.subtext }}>
                      {testimonial.authorRole}
                    </div>
                  ) : null}
                </SurfaceCard>
              ))}
            </div>
          </SectionBlock>
        )}

        {specialties.length > 0 && (
          <SectionBlock>
            <SectionTitle
              eyebrow="Specialties"
              title="Areas of care"
              description="A compact chip grid keeps the site feeling structured and easy to scan."
              center
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {specialties.map((specialty) => (
                <span
                  key={specialty.id}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: style.border, backgroundColor: style.cardBg }}
                >
                  <CheckCircle2 className="h-4 w-4" style={{ color: website.primaryColor }} />
                  {specialty.label}
                </span>
              ))}
            </div>
          </SectionBlock>
        )}

        {faqs.length > 0 && (
          <SectionBlock id="faq" bg={style.cardBg}>
            <SectionTitle
              eyebrow="FAQ"
              title="Frequently asked questions"
              description="The reference site keeps this section elegant and easy to expand, so we do the same."
              center
            />
            <div className="mx-auto mt-10 max-w-3xl divide-y rounded-[28px] border" style={{ borderColor: style.border }}>
              {faqs.map((faq) => (
                <details key={faq.id} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                    <span>{faq.question}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: style.subtext }} />
                  </summary>
                  <p className="mt-3 text-sm leading-7" style={{ color: style.subtext }}>
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </SectionBlock>
        )}

        <SectionBlock id="contact">
          <SectionTitle
            eyebrow="Contact"
            title="Get in touch"
            description="Send a message and the clinic follows up directly - no phone tag required."
            center
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {website.contactPhone ? <ContactRow icon={Phone} label="Phone" value={website.contactPhone} color={website.primaryColor} subtext={style.subtext} /> : null}
              {website.contactEmail ? <ContactRow icon={Mail} label="Email" value={website.contactEmail} color={website.primaryColor} subtext={style.subtext} /> : null}
              {website.contactAddress ? <ContactRow icon={MapPin} label="Address" value={website.contactAddress} color={website.primaryColor} subtext={style.subtext} /> : null}
              {website.contactHours ? <ContactRow icon={Clock3} label="Hours" value={website.contactHours} color={website.primaryColor} subtext={style.subtext} /> : null}

              {mapEmbedUrl ? (
                <div
                  className="overflow-hidden rounded-[24px] border"
                  style={{ borderColor: style.border, backgroundColor: style.cardBg }}
                >
                  <iframe src={mapEmbedUrl} className="min-h-[220px] w-full" loading="lazy" title="Map" />
                </div>
              ) : null}
            </div>

            <LeadForm websiteSlug={website.slug} style={style} accentColor={website.primaryColor} isEditorPreview={isEditorPreview} />
          </div>
        </SectionBlock>
      </main>

      <footer className="border-t px-4 py-8 sm:px-6 lg:px-8" style={{ borderColor: style.border }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center text-xs sm:text-sm">
          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {socialLinks.map((platform) => {
                const Icon = platform.icon
                return (
                  <a
                    key={platform.field}
                    href={platform.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={platform.label}
                    className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:-translate-y-0.5"
                    style={{ background: `linear-gradient(135deg, ${website.primaryColor}, ${website.secondaryColor})` }}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <p className="font-semibold">{website.footerTagline || 'Your trusted healthcare partner.'}</p>
            <p style={{ color: style.subtext }}>{website.footerCopyright || `Copyright ${new Date().getFullYear()} ${businessName}`}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
  subtext: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-[24px] border px-5 py-4" style={{ borderColor: 'var(--border-soft)', backgroundColor: 'rgba(255,255,255,0.6)' }}>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: subtext }}>
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold whitespace-pre-line">{value}</p>
      </div>
    </div>
  )
}

function LeadForm({
  websiteSlug,
  style,
  accentColor,
  isEditorPreview,
}: {
  websiteSlug: string
  style: (typeof TEMPLATE_STYLES)[string]
  accentColor: string
  isEditorPreview: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (isEditorPreview) {
      setSubmitted(true)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/website/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteSlug,
          name: name.trim() || null,
          email: email.trim(),
          phone: phone.trim() || null,
          message: message.trim() || null,
          source: 'contact_form',
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'Could not send your message. Please try again.')
        return
      }
      setSubmitted(true)
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="rounded-[30px] border p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]"
      style={{ borderColor: style.border, backgroundColor: style.cardBg }}
    >
      {submitted ? (
        <div className="grid min-h-[280px] place-items-center text-center">
          <div>
            <CheckCircle2 className="mx-auto h-10 w-10" style={{ color: accentColor }} />
            <p className="mt-4 text-lg font-bold">Thanks for reaching out</p>
            <p className="mt-2 text-sm leading-7" style={{ color: style.subtext }}>
              The clinic will follow up with you shortly.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-5 text-sm font-semibold underline"
              style={{ color: accentColor }}
            >
              Send another message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: style.subtext }}>
                Name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none"
                style={{ borderColor: style.border, backgroundColor: style.bg, color: style.text }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: style.subtext }}>
                Phone
              </label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none"
                style={{ borderColor: style.border, backgroundColor: style.bg, color: style.text }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: style.subtext }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none"
              style={{ borderColor: style.border, backgroundColor: style.bg, color: style.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: style.subtext }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="What can we help you with?"
              className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none"
              style={{ borderColor: style.border, backgroundColor: style.bg, color: style.text }}
            />
          </div>

          {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send message
          </button>
        </form>
      )}
    </div>
  )
}

function SparkleBadge() {
  return <Star className="h-3.5 w-3.5 fill-current" />
}

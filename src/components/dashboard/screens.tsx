import { Suspense, type ReactNode } from 'react'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  CreditCard,
  Database,
  Sparkles,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Lock,
  Mic,
  NotebookText,
  ShieldCheck,
  Scissors,
  Users,
  Wallet,
  Wrench,
  PanelLeftClose,
  PanelRightClose,
  Bot,
  FileSearch,
  Globe2,
  Plus,
  Settings2,
  SlidersHorizontal,
  Bell,
  Search,
  PanelTop,
  FileSpreadsheet,
  ChevronRight,
  Upload,
  Pencil,
  Eye,
  MapPinned,
  Store,
  MonitorSmartphone,
  X,
} from 'lucide-react'

import { PortalLoginForm } from '@/components/portal/PortalLoginForm'
import { cn } from '@/lib/utils'

import {
  ArrowLink,
  BrandMark,
  BrowserFrame,
  ButtonLink,
  FeatureCard,
  MetricCard,
  PhoneFrame,
  Pill,
  QuoteCard,
  SectionEyebrow,
  SectionHeading,
  SimpleTable,
  SurfaceCard,
  StatusBadge,
  TimelineList,
  ValueCard,
} from './shared'

type ServiceTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

const upcomingAppointments = [
  { name: 'Maria Tan', note: "Women's Haircut & Style", tone: 'teal' as const },
  { name: 'Jordan Lee', note: 'Root Touch-Up', tone: 'blue' as const },
  { name: 'Priya Shah', note: 'Balayage', tone: 'amber' as const },
  { name: 'Marcus Webb', note: 'Skin Fade & Beard Trim', tone: 'rose' as const },
  { name: 'Amit Patel', note: 'Hot Towel Shave', tone: 'emerald' as const },
]

const features = [
  {
    icon: Bot,
    title: 'AI Booking Assistant',
    body: 'Clara answers clients naturally, books visits, collects details, and hands off to staff when needed.',
    tone: 'teal' as const,
  },
  {
    icon: CalendarDays,
    title: 'Smart Calendar',
    body: 'Drag, confirm, reschedule, and protect the business hours without leaving the dashboard.',
    tone: 'blue' as const,
  },
  {
    icon: NotebookText,
    title: 'Client CRM',
    body: 'Keep client history, notes, booking context, reminders, and portal access in one place.',
    tone: 'emerald' as const,
  },
  {
    icon: Lock,
    title: 'Multi-Tenant Security',
    body: 'Every business is isolated with row-level policies, scoped access, and audit friendly records.',
    tone: 'rose' as const,
  },
  {
    icon: LineChart,
    title: 'Operations Analytics',
    body: 'Track utilization, conversions, no-shows, and widget performance at a glance.',
    tone: 'amber' as const,
  },
  {
    icon: Wallet,
    title: 'USDC Billing',
    body: 'Record deposits, track tx hashes, and attach payments directly to appointments.',
    tone: 'teal' as const,
  },
] as const

const workflow = [
  {
    step: '01',
    title: 'Set up the business',
    body: 'Create the business profile, define services, staff, and availability in a few minutes.',
    icon: Store,
  },
  {
    step: '02',
    title: 'Embed the widget',
    body: 'Drop one script or iframe into the business website and let Clara start booking.',
    icon: Globe2,
  },
  {
    step: '03',
    title: 'Review the bookings',
    body: 'Confirm appointments, manage callbacks, send reminders, and capture payments.',
    icon: CheckCircle2,
  },
] as const

const testimonials = [
  {
    quote: 'Our front desk feels like it gained another full-time receptionist overnight. The booking flow looks polished and the reminders are on point.',
    author: 'Sarah Mitchell',
    role: 'Owner, Bloom Beauty Salon',
  },
  {
    quote: 'The widget feels natural for clients and the dashboard gives us exactly the operational clarity we wanted for a modern barbershop.',
    author: 'James Park',
    role: 'Owner, Park Ave Barbershop',
  },
  {
    quote: 'Setup was fast, the calendar is easy to manage, and the portal gives clients the self-service experience we were missing.',
    author: 'Maria Santos',
    role: 'Owner, Santos Hair Studio',
  },
] as const

const services = [
  { name: "Women's Haircut & Style", duration: '60 min', price: '$65', tone: 'teal' as const },
  { name: "Men's Haircut", duration: '30 min', price: '$35', tone: 'blue' as const },
  { name: 'Balayage', duration: '150 min', price: '$175', tone: 'rose' as const },
  { name: 'Beard Trim & Shape', duration: '20 min', price: '$20', tone: 'emerald' as const },
]

const widgetSteps = [
  {
    title: 'Choose a service',
    detail: 'The assistant lists the business services with duration and pricing.',
  },
  {
    title: 'Pick a date and time',
    detail: 'Clara only shows slots that are open in the business schedule.',
  },
  {
    title: 'Add your details',
    detail: 'Clients enter their name, phone, and optional email in the conversation.',
  },
  {
    title: 'Confirm booking',
    detail: 'The appointment is saved, confirmed, and the notification pipeline fires.',
  },
]

const portalTimeline = [
  { time: 'Today', title: "Women's Haircut & Style", description: '4:30 PM with Ava', tone: 'teal' as const },
  { time: 'Tomorrow', title: 'Root Touch-Up', description: 'Payment already processed', tone: 'blue' as const },
  { time: 'Wed', title: 'Loyalty Reward Ready', description: 'Portal message ready', tone: 'emerald' as const },
]

const marketingFaqs = [
  {
    q: 'How long does setup take?',
    a: 'Most businesses are live with services, availability, and the AI voice agent configured in under a week.',
  },
  {
    q: 'Does the AI agent replace my front desk?',
    a: 'No — it complements it. Clara handles after-hours calls, demand spikes, and repetitive questions, then hands off to your team when needed.',
  },
  {
    q: 'Can I run more than one location from one account?',
    a: 'Yes. Every location gets its own calendar, services, and dashboard, with row-level isolation between locations.',
  },
  {
    q: 'How is client data protected?',
    a: 'Encryption in transit and at rest, scoped role-based access, and audit-friendly records for every booking.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No — Clara AI runs entirely in the browser and embeds into your site with a single script tag.',
  },
]

function heroPreview() {
  return (
    <div className="relative">
      <div className="plate-corners relative rounded-[34px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,239,230,0.9))] shadow-[0_28px_90px_-56px_rgba(15,33,41,0.48)]">
        <BrowserFrame title="Business dashboard" subtitle="Live bookings, schedules, and client operations">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Live dashboard</div>
                  <div className="mt-1 font-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">Good evening, Ava</div>
                </div>
                <StatusBadge tone="teal">Online</StatusBadge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Today" value="2" delta="Scheduled today" icon={CalendarDays} tone="teal" />
                <MetricCard label="Upcoming" value="7" delta="Booked & confirmed" icon={Clock3} tone="blue" />
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--text-strong)]">Upcoming appointments</div>
                <ArrowLink href="/dashboard/appointments">See all</ArrowLink>
              </div>
              <div className="mt-4 space-y-3">
                {upcomingAppointments.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border-soft)] bg-white/76 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-strong)]">{item.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{item.note}</div>
                    </div>
                    <StatusBadge tone={item.tone}>Booked</StatusBadge>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </BrowserFrame>
      </div>
      <div className="absolute -bottom-6 -left-6 hidden w-[220px] rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,248,245,0.96))] p-4 shadow-[0_24px_70px_-48px_rgba(15,33,41,0.45)] sm:block">
        <div className="font-display text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--brand)' }}>Live</div>
        <div className="mt-1 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">12,400+</div>
        <div className="text-xs text-[var(--text-muted)]">clients managed this month</div>
      </div>
    </div>
  )
}

export function MarketingHomeScreen() {
  return (
    <div className="relative overflow-hidden bg-[var(--page-bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border-soft)] bg-[rgba(255,253,248,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-8 px-6 py-4 lg:px-8">
          <div className="mr-auto">
            <BrandMark compact />
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--text-strong)] lg:flex">
            <a href="#features" className="transition hover:text-[var(--brand-strong)]">Platform</a>
            <a href="#workflow" className="transition hover:text-[var(--brand-strong)]">How it works</a>
            <a href="#portal" className="transition hover:text-[var(--brand-strong)]">Portal</a>
            <a href="#pricing" className="transition hover:text-[var(--brand-strong)]">Pricing</a>
            <a href="#faq" className="transition hover:text-[var(--brand-strong)]">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <ButtonLink href="/login" variant="secondary" icon="none">
              Sign in
            </ButtonLink>
            <ButtonLink href="/signup" icon="calendar">
              Start free trial
            </ButtonLink>
          </div>
        </div>
      </header>

      <main>
        <section id="producto" className="relative mx-auto mt-6 grid w-full max-w-7xl items-center gap-14 overflow-hidden rounded-[36px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,240,231,0.92))] px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(91, 15, 33,0.11),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(236,170,93,0.12),transparent_26%)]" />
          <div className="relative max-w-xl">
            <SectionEyebrow>AI booking receptionist</SectionEyebrow>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/72 px-3.5 py-1.5 text-[11px] font-semibold text-[var(--text-strong)] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              Voice, calendar, portal, and billing in one flow
            </div>
            <h1 className="mt-6 max-w-[12ch] font-display text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-[var(--text-strong)] sm:text-6xl">
              Every salon and barbershop gets an AI front desk that never misses the call.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--text-muted)]">
              Clara AI centralizes appointments, clients, billing, and a voice agent in one dashboard —
              so your front desk does less and your clients wait less.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/signup" icon="calendar">
                Start 14-Day Free Trial
              </ButtonLink>
              <ButtonLink href="/widget-demo" variant="secondary" icon="arrow">
                See Live Widget
              </ButtonLink>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-[var(--border-soft)] pt-7">
              <div>
                <div className="font-display text-2xl font-bold text-[var(--text-strong)]">120+</div>
                <div className="text-xs text-[var(--text-muted)]">active businesses</div>
              </div>
              <div className="h-8 w-px bg-[var(--border-soft)]" />
              <div>
                <div className="font-display text-2xl font-bold text-[var(--text-strong)]">98.6%</div>
                <div className="text-xs text-[var(--text-muted)]">satisfaction</div>
              </div>
              <div className="h-8 w-px bg-[var(--border-soft)]" />
              <div>
                <div className="font-display text-2xl font-bold text-[var(--text-strong)]">24/7</div>
                <div className="text-xs text-[var(--text-muted)]">voice agent</div>
              </div>
            </div>
          </div>

          {heroPreview()}
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pt-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { value: '67%', label: 'appointment completion rate', detail: 'The booking flow is guided end to end.' },
              { value: '-33%', label: 'no-shows after AI reminders', detail: 'Follow-ups happen before the visit slips.' },
              { value: '13', label: 'average active clients per business', detail: 'Enough volume to feel the impact quickly.' },
              { value: '6 min', label: 'average time to activate a service', detail: 'Fast setup for new businesses and service lines.' },
            ].map((stat) => (
              <SurfaceCard key={stat.label} className="p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{stat.label}</div>
                <div className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{stat.value}</div>
                <div className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{stat.detail}</div>
              </SurfaceCard>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-xl">
            <SectionEyebrow>Platform</SectionEyebrow>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--text-strong)]">
              Everything a modern salon or barbershop needs, on one dashboard
            </h2>
            <p className="mt-3 text-[var(--text-muted)]">
              Six connected modules: what the voice agent books shows up instantly in the calendar, client records, and billing.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} tone={feature.tone} />
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative">
              <SurfaceCard className="relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(91, 15, 33,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(236,170,93,0.12),transparent_24%)]" />
                <div className="relative flex min-h-[540px] flex-col gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Workflow snapshot</div>
                      <div className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                        Calls turn into bookings without friction
                      </div>
                    </div>
                    <StatusBadge tone="teal">24/7</StatusBadge>
                  </div>
                  <PhoneFrame title="Clara AI" subtitle="Client intake live">
                    <div className="space-y-3">
                      <div className="rounded-[20px] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-strong)]">
                        Hello, I can help you schedule a visit, check availability, or route you to the right person.
                      </div>
                      <div className="grid gap-2">
                        {['Choose a service', 'Reserve a time', 'Confirm the visit'].map((item, index) => (
                          <div key={item} className="rounded-[18px] border border-[var(--border-soft)] bg-white/82 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-strong)]">
                                0{index + 1}
                              </div>
                              <div className="text-sm font-semibold text-[var(--text-strong)]">{item}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PhoneFrame>
                  <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/74 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Live routing</div>
                        <div className="mt-1 font-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                          1.2k calls handled this month
                        </div>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-[var(--brand)]" />
                    </div>
                    <div className="ecg-line mt-4 h-10 rounded-[18px] border border-[var(--border-soft)] bg-[linear-gradient(90deg,rgba(91, 15, 33,0.05),rgba(91, 15, 33,0.16),rgba(91, 15, 33,0.05))]" />
                  </div>
                </div>
              </SurfaceCard>
            </div>
            <div>
              <SectionEyebrow>Why Clara AI</SectionEyebrow>
              <h2 className="mt-4 max-w-xl font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text-strong)] sm:text-4xl">
                Built for salons and barbershops that cannot afford to miss a call
              </h2>
              <div className="mt-7 flex flex-col gap-4">
                {workflow.map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-[var(--border-soft)] bg-white/78 p-5 shadow-[0_16px_40px_-36px_rgba(15,33,41,0.45)] backdrop-blur-sm">
                    <div className="flex gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{item.step}</div>
                        <div className="mt-1 font-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{item.title}</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{item.body}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Pill tone="teal">Enterprise-grade encryption</Pill>
                <Pill tone="slate">99.9% uptime</Pill>
                <Pill tone="slate">Dedicated support</Pill>
              </div>
            </div>
          </div>
        </section>

        <section id="portal" className="border-y border-[var(--border-soft)]" style={{ background: 'var(--panel-soft)' }}>
          <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
            <div className="max-w-xl">
              <SectionEyebrow>Client portal &amp; widget</SectionEyebrow>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--text-strong)]">
                Self-service booking, payments, and support
              </h2>
            </div>
            <div className="mt-10 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
              <SurfaceCard className="p-6">
                <SectionEyebrow>Client portal</SectionEyebrow>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">
                  Reschedule, cancel, and pay without calling the front desk
                </h3>
                <div className="mt-6 space-y-4">
                  <TimelineList items={portalTimeline} />
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-6 lg:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionEyebrow>Widget preview</SectionEyebrow>
                    <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">
                      A booking experience clients will actually use
                    </h3>
                  </div>
                  <StatusBadge tone="teal">Live</StatusBadge>
                </div>

                <div className="mt-6 flex justify-center">
                  <PhoneFrame title="Clara AI" subtitle="AI Assistant Online">
                    <div className="space-y-3">
                      <div className="border border-[var(--border-soft)] bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand-strong)]">
                        Welcome back. How can I help you book or manage an appointment today?
                      </div>
                      <div className="space-y-2">
                        {services.map((service) => (
                          <div key={service.name} className="border border-[var(--border-soft)] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-bold text-[var(--text-strong)]">{service.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">{service.duration}</div>
                              </div>
                              <span className="text-xs font-semibold text-[var(--brand)]">{service.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PhoneFrame>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
          <SectionHeading
            eyebrow={<SectionEyebrow>Clients</SectionEyebrow>}
            title="What salons and barbershops already using it say"
            align="center"
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <QuoteCard key={item.author} quote={item.quote} author={item.author} role={item.role} />
            ))}
          </div>
        </section>

        <section id="pricing" className="border-t border-[var(--border-soft)]" style={{ background: 'var(--panel-soft)' }}>
          <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
            <SectionHeading
              eyebrow={<SectionEyebrow>Pricing</SectionEyebrow>}
              title="Clear plans for businesses at every stage"
              description="The first phase focuses on the widget, business dashboard, client portal, and USDC billing. Stripe can be added later if you want it."
              align="center"
            />
            <div className="mt-10 grid gap-px border border-[var(--border-soft)] bg-[var(--border-soft)] lg:grid-cols-4">
              {[
                { name: 'Free', price: '$0', body: 'Sandbox, demo data, and widget preview.' },
                { name: 'Starter', price: '$49', body: 'Single location with calendar, widget, and portal.' },
                { name: 'Professional', price: '$99', body: 'Automation, analytics, billing, and AI tools.', featured: true },
                { name: 'Enterprise', price: '$299', body: 'Multi-location, custom integrations, and dedicated support.' },
              ].map((plan) => (
                <div key={plan.name} className="relative bg-[var(--page-bg)] p-6" style={plan.featured ? { boxShadow: 'inset 0 0 0 1px var(--brand)' } : undefined}>
                  {plan.featured ? <Pill tone="teal" className="mb-3">Most popular</Pill> : null}
                  <div className="text-sm font-bold text-[var(--text-strong)]">{plan.name}</div>
                  <div className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--text-strong)]">{plan.price}</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{plan.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-24 lg:px-8">
          <div className="max-w-xl">
            <SectionEyebrow>Frequently asked</SectionEyebrow>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--text-strong)]">Before you book a demo</h2>
          </div>
          <div className="mt-10 border-t border-[var(--border-soft)]">
            {marketingFaqs.map((item) => (
              <details key={item.q} className="group border-b border-[var(--border-soft)] py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[17px] font-semibold text-[var(--text-strong)]">
                  {item.q}
                  <Plus className="h-4 w-4 shrink-0 transition group-open:rotate-45" style={{ color: 'var(--brand)' }} />
                </summary>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,253,248,0.72),rgba(245,239,230,0.98))]">
          <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
            <SurfaceCard className="relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(91, 15, 33,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(236,170,93,0.12),transparent_24%)]" />
              <div className="relative grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
                <div>
                  <SectionEyebrow>Launch ready</SectionEyebrow>
                  <h2 className="mt-5 max-w-lg font-display text-4xl font-semibold tracking-[-0.05em] text-[var(--text-strong)] sm:text-5xl">
                    Ready to bring Clara into your practice?
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[var(--text-muted)]">
                    Bring the widget, portal, dashboard, and AI receptionist online in one system, configured with your real services.
                  </p>
                  <div className="mt-7 flex flex-col gap-2.5 text-sm text-[var(--text-strong)]">
                    <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'var(--brand)' }} />No card required for the trial</div>
                    <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'var(--brand)' }} />Calendar migration included</div>
                    <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'var(--brand)' }} />Support in English &amp; Spanish, 24/7</div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SurfaceCard className="p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Deployment</div>
                    <div className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">14 days</div>
                    <div className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">Typical rollout for a new business.</div>
                  </SurfaceCard>
                  <SurfaceCard className="p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Support</div>
                    <div className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">24/7</div>
                    <div className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">English and Spanish coverage included.</div>
                  </SurfaceCard>
                  <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
                    <ButtonLink href="/signup" icon="calendar">
                      Start Free Trial
                    </ButtonLink>
                    <ButtonLink href="/dashboard" variant="secondary" icon="arrow">
                      Open Dashboard
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-soft)]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <BrandMark compact />
            <p className="mt-3.5 max-w-[240px] text-[13px] leading-6 text-[var(--text-muted)]">
              Calendar, clients, billing, and an AI voice agent — one dashboard for your business.
            </p>
          </div>
          <div>
            <div className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Product</div>
            <div className="mt-3.5 flex flex-col gap-2.5 text-sm">
              <a href="#features" className="hover:text-[var(--brand-strong)]">Platform</a>
              <a href="#pricing" className="hover:text-[var(--brand-strong)]">Pricing</a>
              <a href="/widget-demo" className="hover:text-[var(--brand-strong)]">Widget demo</a>
            </div>
          </div>
          <div>
            <div className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Company</div>
            <div className="mt-3.5 flex flex-col gap-2.5 text-sm">
              <a href="#portal" className="hover:text-[var(--brand-strong)]">Client portal</a>
              <a href="#faq" className="hover:text-[var(--brand-strong)]">FAQ</a>
              <a href="/login" className="hover:text-[var(--brand-strong)]">Sign in</a>
            </div>
          </div>
          <div>
            <div className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Legal</div>
            <div className="mt-3.5 flex flex-col gap-2.5 text-sm">
              <a href="#" className="hover:text-[var(--brand-strong)]">Privacy</a>
              <a href="#" className="hover:text-[var(--brand-strong)]">Terms</a>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border-soft)] px-6 py-5 text-xs text-[var(--text-muted)] lg:px-8">
          <div className="mx-auto w-full max-w-7xl">© {new Date().getFullYear()} Clara AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

// DashboardOverviewScreen was removed from here — this was the single
// biggest source of confusion in the whole app: "Dr. Harrington", "Sunday,
// April 26, 2026", and the client names in dashboardStats/dashboardSchedule
// (Dault Hussain, Md Shair...) looked convincing enough that they were
// mistaken for real data during testing (Juan/Hermes both flagged this). A
// real version now lives in src/components/dashboard/DashboardOverviewManager.tsx:
// real greeting/date, real today's schedule and upcoming list
// (listAppointmentsForBusiness), real stats (getDashboardAnalytics), real
// live agent + knowledge doc counts, and real revenue (getBillingSummary).

// DashboardAppointmentsScreen was removed from here — same story: hardcoded
// rows (Md Tajuddin, Shakib, Amit, Dault Hussain), status filter pills with
// no onClick, action buttons that were links back to this same page. A real
// version now lives in src/components/dashboard/AppointmentsManager.tsx, wired
// to services/appointments.ts (listAppointmentsForBusiness) and the already-
// working POST /api/appointments/status route (which also sends the client
// email + creates the in-app notification — reusing it instead of calling
// updateAppointmentStatus directly keeps that behavior).

// DashboardWidgetScreen was removed from here — colors/tone/slot duration
// were plain display values (not inputs) and the embed snippet pointed at
// a hardcoded iframe src. A real version now lives in
// src/components/dashboard/WidgetManager.tsx, wired to services/widgets.ts
// (getWidgetForBusiness/updateWidget) and the real /api/widget-script
// embed route.

// DashboardWebsiteScreen was removed from here — it was a static preview
// mockup with fake copy ("Heart Care You Can Trust") and no connection to
// the real websites table. A real, functional editor now lives in
// src/components/dashboard/WebsiteEditor.tsx, wired to the already-working
// /api/website/save, /publish, and /upload-image routes.

// DashboardServicesScreen was removed from here — same story as the other
// screens already replaced: `services` was a hardcoded local array (see the
// `const services = [...]` above), the "Quick create panel" fields were
// plain <div>s (not <input>s), and "Create service" was a link to this same
// page, not a submit handler. A real version now lives in
// src/components/dashboard/ServicesManager.tsx, wired directly to
// services/services.ts's createService/deleteService/
// setServiceActive via the browser Supabase client (RLS-protected,
// no dedicated API route needed for this one).

// DashboardClientsScreen was removed from here — same story: hardcoded
// visitor list (Md Tajuddin, Shakib, Amit, "Just Funny"), "Add client"
// linked back to this same page, client profile stats (13 appointments,
// "Dault Hussain") baked in as literal strings. A real version now lives in
// src/components/dashboard/ClientsManager.tsx, backed by services/clients.ts
// (listClientsForBusiness/createClient) and the appointments already
// loaded for this business to compute each client's real visit stats.

// DashboardSettingsScreen was removed from here — hours/breaks were plain
// text (not inputs), "Save" and "Block date" were links back to this same
// page, and "0 blocked" was a fixed literal. A real version now lives in
// src/components/dashboard/SettingsManager.tsx, wired to services/business.ts
// (updateBusiness, getBusinessAvailability/upsertBusinessAvailability,
// getClosedDates/addClosedDate/removeClosedDate — all already existed).
// Fixed a real bug along the way: upsertBusinessAvailability/addClosedDate
// upserted without an onConflict target, so saving the same day/date twice
// would throw a duplicate-key error instead of updating.

// DashboardSupportScreen was removed from here — 3 hardcoded tickets and a
// static "reschedule" thread with a composer that didn't submit anywhere.
// A real version now lives in src/components/dashboard/SupportManager.tsx,
// wired to services/support.ts (already existed: tickets + messages +
// status) — replies actually post to support_messages and status buttons
// call updateSupportTicketStatus.

// DashboardNotificationsScreen was removed from here — 4 example
// notifications plus a "Read and action statuses" panel with invented
// delivery percentages (86% email delivery, 72% widget pings, none of it
// backed by real data). A real version now lives in
// src/components/dashboard/NotificationsManager.tsx, wired to
// services/notifications.ts (already existed): a real activity feed with
// mark-as-read / mark-all-read against the notifications table.

// DashboardAnalyticsScreen was removed from here — every metric (67%
// conversion, 33% no-show, the 7-day bar chart values, "$8.2k" revenue)
// was a fixed literal. A real version now lives in
// src/components/dashboard/AnalyticsManager.tsx: conversion/no-show/
// completion computed from real appointments and conversations
// (getDashboardAnalytics, listConversationsForBusiness — already
// existed), revenue from getBillingSummary, and the weekly bar chart from
// real appointment creation timestamps this week.

// DashboardBillingScreen was removed from here — plan cards and the
// transaction list were both hardcoded literals (no plan was ever really
// "Active", the tx hashes were fake). A real version now lives in
// src/components/dashboard/BillingManager.tsx, reading the real subscription
// (services/business.ts getSubscription), payment wallet config, and
// billing_transactions history (services/billing.ts, already existed).

// PortalHomeScreen was removed from here — "Welcome back, Dault Hussain",
// a fixed "Apr 28, 2026" appointment and 3 fake "Messages" were all
// literals. A real version now lives in
// src/components/portal/PortalHomeManager.tsx, fed by real client +
// appointment data (services/clients.ts getPortalClientForAuthUser,
// services/appointments.ts getClientAppointmentsForPortal) from
// src/app/(portal)/portal/page.tsx.

// PortalRegisterScreen was removed from here — the "inputs" were static
// divs with placeholder text, and the submit button just linked to
// /portal without creating anything. A real version now lives in
// src/components/portal/PortalRegisterForm.tsx, which posts to
// /api/portal/check-email (pre-creates the client record, then sends a
// magic link).

// PortalAppointmentsScreen was removed from here — the "Reschedule" and
// "Cancel" buttons were ButtonLinks back to the same page, no-ops. A real
// version now lives in src/components/portal/PortalAppointmentsManager.tsx,
// wired to the new /api/portal/appointments/[id]/cancel, /reschedule and
// /slots routes (clients have no direct RLS write access to appointments,
// so those routes run on the admin client after verifying ownership).

export function PortalLoginScreen() {
  return (
    <div className="grid min-h-[calc(100vh-0px)] gap-8 px-4 py-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
      <SurfaceCard className="relative overflow-hidden bg-slate-950 p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.18),transparent_34%)]" />
        <div className="relative">
          <BrandMark />
          <h1 className="mt-10 max-w-xl text-5xl font-black tracking-tight sm:text-6xl">
            The client portal that feels like concierge care
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-white/76">
            Access appointments, book a visit, and manage support requests with a secure magic-link or OTP flow.
          </p>
          <div className="mt-8 space-y-3">
            <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4">
              <div className="text-sm font-bold">Magic link login</div>
              <div className="text-xs text-white/70">Send a one-time login link to the client email.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4">
              <div className="text-sm font-bold">OTP fallback</div>
              <div className="text-xs text-white/70">Use a six-digit code when email access is limited.</div>
            </div>
          </div>
        </div>
      </SurfaceCard>
      <SurfaceCard className="p-8">
        <Suspense
          fallback={
            <div className="max-w-md space-y-4">
              <SectionEyebrow>Portal login</SectionEyebrow>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-strong)]">Welcome back</h2>
              <p className="text-sm leading-7 text-[var(--text-muted)]">Loading the login form...</p>
            </div>
          }
        >
          <PortalLoginForm />
        </Suspense>
      </SurfaceCard>
    </div>
  )
}

// PortalSupportScreen was removed from here — the ticket list was 4
// literal subject strings with no click handler, and the "conversation"
// was two hardcoded chat bubbles. A real version now lives in
// src/components/portal/PortalSupportManager.tsx, wired to
// /api/portal/support (create/list tickets) and
// /api/portal/support/[id]/messages (thread + reply) — clients have no
// RLS write access to support_tickets/support_messages, so those routes
// run on the admin client after verifying ticket ownership.

export function WidgetDemoScreen() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={<SectionEyebrow>Widget demo</SectionEyebrow>}
        title="A live booking assistant that can sit on any website"
        description="The embed can be an iframe or a script snippet, and the widget keeps the business design language intact."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.96fr]">
        <BrowserFrame title="Public business website" subtitle="Widget anchored at the corner of the page" accent="rose">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <SurfaceCard className="bg-slate-950 p-7 text-white">
              <h2 className="text-5xl font-black tracking-tight sm:text-6xl">
                Look Your Best
                <span className="block text-rose-300">Every Time</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/74">
                Clients can book directly from the website while Clara captures the booking, reminders, and payment status.
              </p>
            </SurfaceCard>
            <PhoneFrame title="Clara AI" subtitle="AI Assistant Online" accent="rose">
              <div className="space-y-3">
                {widgetSteps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-[var(--border-soft)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-[var(--text-strong)]">{step.title}</div>
                      <span className="text-xs text-[var(--text-muted)]">{index + 1}</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{step.detail}</div>
                  </div>
                ))}
              </div>
            </PhoneFrame>
          </div>
        </BrowserFrame>

        <SurfaceCard className="p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Script snippet</div>
          <pre className="mt-4 overflow-auto rounded-[24px] bg-slate-950 p-5 text-[11px] leading-6 text-teal-100">
{`<script src="http://localhost:3000/widget-script.js"></script>
<script>
  window.ClaraWidget.init({
    businessSlug: "salon-demo",
    color: "#dc2626",
    tone: "professional-and-friendly"
  });
</script>`}
          </pre>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ValueCard label="Widget size" value="420 x 680" icon={MonitorSmartphone} tone="teal" />
            <ValueCard label="Slot minutes" value="15" icon={Clock3} tone="blue" />
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

export function SiteSlugScreen({ slug }: { slug: string }) {
  return (
    <div className="space-y-16 bg-[var(--page-bg)]">
      <div className="rounded-b-[36px] bg-slate-950 text-white shadow-[0_24px_90px_rgba(15,23,42,0.14)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight">Ava Bennett</div>
              <div className="text-[11px] text-white/66">Master Stylist & Owner</div>
            </div>
          </div>
          <nav className="hidden gap-8 text-sm font-semibold text-white/74 lg:flex">
            {['Home', 'About', 'Services', 'Client Info', 'Testimonials', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <ButtonLink href="/widget-demo" icon="calendar">
            Book appointment
          </ButtonLink>
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div className="max-w-2xl">
            <Pill tone="rose">Award-winning master stylist</Pill>
            <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Expert Style
              <span className="block text-rose-300">You Can Trust</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/74">
              The {slug} business website blends premium branding, strong client trust signals, and the Clara booking assistant.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/widget-demo" icon="calendar">
                Book appointment
              </ButtonLink>
              <ButtonLink href="/portal" variant="secondary" icon="arrow">
                Client portal
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-4">
            <SurfaceCard className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Stylist profile</div>
                  <div className="mt-2 text-2xl font-black tracking-tight text-[var(--text-strong)]">15+ years of styling excellence</div>
                </div>
                <StatusBadge tone="rose">Top Stylist 2022-2024</StatusBadge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ValueCard label="Years" value="15+" icon={Sparkles} tone="rose" />
                <ValueCard label="Clients" value="12,000+" icon={Users} tone="blue" />
                <ValueCard label="Success" value="98.6%" icon={CheckCircle2} tone="emerald" />
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {['Licensed Cosmetologist', 'Balayage Specialist', 'Redken Certified'].map((item) => (
                  <div key={item} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-strong)]">
                    {item}
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-6 lg:px-8">
        <section id="about" className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Licensed Cosmetologist', 'State-licensed with advanced color and cutting certifications'],
              ['3x Stylist of the Year', 'Recognized by the regional stylist association'],
              ['500+ five-star reviews', 'Consistently rated for quality and client care'],
              ['Redken & Olaplex Certified', 'Ongoing education in the latest color and treatment techniques'],
            ].map(([title, body], index) => (
              <SurfaceCard key={title} className={cn('p-5', index === 1 ? 'bg-rose-50/70' : 'bg-white')}>
                <div className="text-lg font-black tracking-tight text-[var(--text-strong)]">{title}</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{body}</div>
              </SurfaceCard>
            ))}
          </div>
          <SurfaceCard className="p-6">
            <SectionEyebrow>About the stylist</SectionEyebrow>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-[var(--text-strong)]">Years of styling excellence</h2>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--text-muted)]">
              The public site tells the salon&apos;s story, shows the specialties, and makes booking the obvious next step. It is intentionally calm, premium, and easy to scan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/widget-demo" icon="calendar">
                Full biography
              </ButtonLink>
              <ButtonLink href="/portal" variant="secondary" icon="arrow">
                Contact us
              </ButtonLink>
            </div>
          </SurfaceCard>
        </section>

        <section id="services" className="space-y-6">
          <SectionHeading
            eyebrow={<SectionEyebrow>Signature services</SectionEyebrow>}
            title="Comprehensive styling expertise"
            description="Services are presented as simple cards with enough detail to inspire confidence and enough brevity to convert."
            align="center"
          />
          {(() => {
            const services: Array<{
              title: string
              body: string
              tone: ServiceTone
            }> = [
              {
                title: 'Balayage & Color',
                body: 'Hand-painted color and full-color services tailored to your skin tone and style.',
                tone: 'teal',
              },
              {
                title: 'Precision Haircuts',
                body: 'Consultation-first cuts and styling for every hair type and texture.',
                tone: 'rose',
              },
              {
                title: 'Bridal & Event Styling',
                body: 'Trial runs and day-of styling for weddings, proms, and special occasions.',
                tone: 'blue',
              },
            ]

            return (
              <div className="grid gap-4 lg:grid-cols-3">
                {services.map((item) => (
                  <FeatureCard key={item.title} icon={Sparkles} title={item.title} body={item.body} tone={item.tone} />
                ))}
              </div>
            )
          })()}
        </section>

        <section id="testimonials" className="space-y-6">
          <SectionHeading
            eyebrow={<SectionEyebrow>Testimonials</SectionEyebrow>}
            title="Loved by our clients"
            align="center"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <QuoteCard key={item.author} quote={item.quote} author={item.author} role={item.role} />
            ))}
          </div>
        </section>

        <section id="contact" className="rounded-[34px] bg-gradient-to-r from-teal-600 to-cyan-500 px-6 py-12 text-white shadow-[0_20px_70px_rgba(13,148,136,0.18)] lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]">14-day free trial - no credit card</div>
              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Ready to transform your look?</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/80">
                Embed the widget, launch the portal, and give clients a clean digital front door without rebuilding the whole site.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/signup" icon="calendar">
                Start your free trial
              </ButtonLink>
              <ButtonLink href="/widget-demo" variant="secondary" icon="arrow">
                See live demo
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// AuthLoginScreen / AuthSignupScreen were removed from here — they were
// static mockups (the "email"/"password" fields were plain <div>s, not
// inputs; "Sign in" was a link to /dashboard with no auth check at all).
// Real, functional versions now live directly in
// src/app/(auth)/login/page.tsx and src/app/(auth)/signup/page.tsx, wired
// to supabase.auth and services/business.ts's createBusiness().

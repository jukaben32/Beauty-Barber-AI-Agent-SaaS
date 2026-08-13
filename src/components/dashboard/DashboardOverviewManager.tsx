import { CalendarDays, Clock3, MessageSquareMore, PhoneCall, RotateCcw, Search, TrendingUp, Users } from 'lucide-react'
import type { ComponentType } from 'react'
import type { AppointmentWithRelations, Conversation, DashboardAnalytics } from '@/types'
import { ArrowLink, StatusBadge, SurfaceCard } from '@/components/dashboard/shared'
import { getDateKeyInTimeZone } from '@/services/_shared'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Booked',
  pending_confirmation: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
}

type BadgeTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

const STATUS_TONE: Record<string, BadgeTone> = {
  scheduled: 'teal',
  pending_confirmation: 'blue',
  confirmed: 'emerald',
  completed: 'emerald',
  cancelled: 'rose',
  no_show: 'amber',
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

const TONES = {
  teal: {
    accent: 'linear-gradient(180deg, rgba(21, 57, 142,0.96), rgba(21, 57, 142,0.18))',
    soft: 'rgba(21, 57, 142,0.12)',
    border: 'rgba(21, 57, 142,0.20)',
    color: 'var(--brand-strong)',
  },
  emerald: {
    accent: 'linear-gradient(180deg, rgba(14,165,233,0.96), rgba(14,165,233,0.18))',
    soft: 'rgba(14,165,233,0.12)',
    border: 'rgba(14,165,233,0.20)',
    color: '#0f766e',
  },
  violet: {
    accent: 'linear-gradient(180deg, rgba(124,58,237,0.96), rgba(124,58,237,0.18))',
    soft: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.20)',
    color: '#6d28d9',
  },
  amber: {
    accent: 'linear-gradient(180deg, rgba(236,170,93,0.96), rgba(236,170,93,0.18))',
    soft: 'rgba(236,170,93,0.12)',
    border: 'rgba(236,170,93,0.20)',
    color: '#b45309',
  },
  slate: {
    accent: 'linear-gradient(180deg, rgba(100,116,139,0.96), rgba(100,116,139,0.18))',
    soft: 'rgba(100,116,139,0.12)',
    border: 'rgba(100,116,139,0.20)',
    color: 'var(--text-muted)',
  },
} as const

type ToneKey = keyof typeof TONES

type TrendDay = {
  key: string
  label: string
  total: number
  booked: number
}

function formatCount(value: number) {
  return NUMBER_FORMAT.format(value)
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator === 0) return '0%'
  const value = Math.round((numerator / denominator) * 1000) / 10
  return Number.isInteger(value) ? `${value.toFixed(0)}%` : `${value.toFixed(1)}%`
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainder = safeSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function formatAppointmentDateTime(iso: string, timeZone: string) {
  const date = new Date(iso)
  const datePart = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  const timePart = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date)
  return `${datePart} ${timePart}`
}

function formatTrendLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(date)
}

function getGreeting(timeZone: string, now: Date) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(now))
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function buildTrendSeries(conversations: Conversation[], timeZone: string, now: Date) {
  const bucketMap = new Map<string, { total: number; booked: number }>()

  for (const conversation of conversations) {
    const key = getDateKeyInTimeZone(new Date(conversation.startedAt), timeZone)
    const bucket = bucketMap.get(key) ?? { total: 0, booked: 0 }
    bucket.total += 1
    if (conversation.outcome === 'booked_appointment') {
      bucket.booked += 1
    }
    bucketMap.set(key, bucket)
  }

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - (13 - index))
    const key = getDateKeyInTimeZone(date, timeZone)
    const bucket = bucketMap.get(key)
    return {
      key,
      label: formatTrendLabel(date, timeZone),
      total: bucket?.total ?? 0,
      booked: bucket?.booked ?? 0,
    }
  })
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baseY: number) {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  return `M ${first.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest
    .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')} L ${points[points.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} Z`
}

function getAppointmentTone(status: string): BadgeTone {
  return STATUS_TONE[status] ?? 'slate'
}

function OverviewStatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  helper?: string
  tone: ToneKey
}) {
  const toneStyles = TONES[tone]

  return (
    <SurfaceCard className="relative overflow-hidden p-5">
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: toneStyles.accent }} />
      <div className="flex h-full flex-col pl-1">
        <div
          className="grid h-11 w-11 place-items-center rounded-[16px] border"
          style={{ background: toneStyles.soft, borderColor: toneStyles.border, color: toneStyles.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text-strong)]">
          {value}
        </div>
        <div className="mt-1 text-sm font-medium text-[var(--text-strong)]">{label}</div>
        {helper ? <div className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{helper}</div> : null}
      </div>
    </SurfaceCard>
  )
}

function QuickStatRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  tone: ToneKey
}) {
  const toneStyles = TONES[tone]

  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border"
        style={{ background: toneStyles.soft, borderColor: toneStyles.border, color: toneStyles.color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</div>
        <div className="mt-1 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{value}</div>
      </div>
    </div>
  )
}

function TrendChart({ series }: { series: TrendDay[] }) {
  const width = 1000
  const height = 320
  const left = 52
  const right = 28
  const top = 22
  const bottom = 44
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const highestValue = Math.max(1, ...series.map((day) => Math.max(day.total, day.booked)))
  const tickStep = Math.max(1, Math.ceil(highestValue / 4))
  const tickMax = tickStep * 4
  const totalPoints = series.map((day, index) => {
    const x = left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth)
    const y = top + plotHeight - (day.total / tickMax) * plotHeight
    return { x, y }
  })
  const bookedPoints = series.map((day, index) => {
    const x = left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth)
    const y = top + plotHeight - (day.booked / tickMax) * plotHeight
    return { x, y }
  })
  const baseY = top + plotHeight
  const areaPath = buildAreaPath(totalPoints, baseY)
  const totalPath = buildLinePath(totalPoints)
  const bookedPath = buildLinePath(bookedPoints)
  const ticks = Array.from({ length: 5 }, (_, index) => tickMax - index * tickStep)

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,240,231,0.72))] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full overflow-visible" aria-label="Conversation trend over the last 14 days" role="img">
        <defs>
          <linearGradient id="overview-total-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(21, 57, 142,0.26)" />
            <stop offset="100%" stopColor="rgba(21, 57, 142,0.02)" />
          </linearGradient>
        </defs>

        {ticks.map((tick, index) => {
          const y = top + (plotHeight / 4) * index
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(15,33,41,0.08)" strokeDasharray="1 7" />
              <text x={12} y={y + 4} fill="var(--text-muted)" style={{ fontSize: 10, fontWeight: 500 }}>
                {tick}
              </text>
            </g>
          )
        })}

        {series.map((day, index) => {
          const x = left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth)
          return (
            <g key={day.key}>
              <line x1={x} x2={x} y1={top} y2={baseY} stroke="rgba(15,33,41,0.04)" />
              <text x={x} y={height - 12} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 10, fontWeight: 500 }}>
                {day.label}
              </text>
            </g>
          )
        })}

        {areaPath ? <path d={areaPath} fill="url(#overview-total-fill)" /> : null}
        {totalPath ? <path d={totalPath} fill="none" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {bookedPath ? <path d={bookedPath} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {totalPoints.length > 0 ? (
          <circle
            cx={totalPoints[totalPoints.length - 1].x}
            cy={totalPoints[totalPoints.length - 1].y}
            r="5"
            fill="white"
            stroke="var(--brand)"
            strokeWidth="3"
          />
        ) : null}
        {bookedPoints.length > 0 ? (
          <circle
            cx={bookedPoints[bookedPoints.length - 1].x}
            cy={bookedPoints[bookedPoints.length - 1].y}
            r="5"
            fill="white"
            stroke="#7c3aed"
            strokeWidth="3"
          />
        ) : null}
      </svg>
    </div>
  )
}

export function DashboardOverviewManager({
  businessName,
  businessSlug,
  timezone,
  analytics,
  conversations,
  appointments,
}: {
  businessName: string
  businessSlug: string
  timezone: string
  analytics: DashboardAnalytics
  conversations: Conversation[]
  appointments: AppointmentWithRelations[]
}) {
  const now = new Date()
  const greeting = getGreeting(timezone, now)
  const totalConversations = analytics.totalConversations
  const bookedAppointments = analytics.bookedConversations
  const conversionRate = formatPercent(bookedAppointments, totalConversations)
  const validConversationDurations = conversations.filter((conversation) => conversation.durationSeconds > 0)
  const averageConversationDuration =
    validConversationDurations.length > 0
      ? Math.round(validConversationDurations.reduce((sum, conversation) => sum + conversation.durationSeconds, 0) / validConversationDurations.length)
      : 0
  const avgCallDuration = formatDuration(averageConversationDuration)
  const trendSeries = buildTrendSeries(conversations, timezone, now)
  const todayKey = getDateKeyInTimeZone(now, timezone)
  const recentKeys = new Set(
    Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setUTCDate(date.getUTCDate() - index)
      return getDateKeyInTimeZone(date, timezone)
    }),
  )
  const todayCalls = conversations.filter((conversation) => getDateKeyInTimeZone(new Date(conversation.startedAt), timezone) === todayKey).length
  const thisWeekCalls = conversations.filter((conversation) => recentKeys.has(getDateKeyInTimeZone(new Date(conversation.startedAt), timezone))).length
  const recentAppointments = [...appointments].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).slice(0, 5)

  const statCards = [
    {
      label: 'Total Conversations',
      value: formatCount(totalConversations),
      helper: 'Across every channel',
      icon: MessageSquareMore,
      tone: 'teal' as const,
    },
    {
      label: 'Appointments Booked',
      value: formatCount(bookedAppointments),
      helper: 'Bookable outcomes',
      icon: CalendarDays,
      tone: 'emerald' as const,
    },
    {
      label: 'Conversion Rate',
      value: conversionRate,
      helper: 'Booked over total conversations',
      icon: TrendingUp,
      tone: 'violet' as const,
    },
    {
      label: 'Avg Call Duration',
      value: avgCallDuration,
      helper: 'Average recorded conversation',
      icon: Clock3,
      tone: 'amber' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <SurfaceCard className="relative overflow-hidden p-6 md:p-7" glow>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(21, 57, 142,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(236,170,93,0.10),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/78 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)] backdrop-blur-sm">
              Overview
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-[var(--text-strong)] md:text-5xl">
              Practice performance at a glance
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)] md:text-base">
              {greeting}, {businessSlug}. {businessName} is tracking {formatCount(totalConversations)} conversations and {formatCount(bookedAppointments)} booked appointments.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white/78 px-4 py-3 text-sm text-[var(--text-muted)] backdrop-blur-sm">
              <Search className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Search...</span>
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Ctrl K
              </span>
            </div>
            <StatusBadge tone="teal">{analytics.activeAgents} active agents</StatusBadge>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <OverviewStatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <SurfaceCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Conversation Trend</div>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">Last 14 days</h2>
            </div>
            <StatusBadge tone="teal">Rolling window</StatusBadge>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
              Total conversations
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
              Appointments booked
            </div>
          </div>
          <div className="mt-5">
            <TrendChart series={trendSeries} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Quick Stats</div>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">Snapshot</h2>
            </div>
            <StatusBadge tone="slate">This week</StatusBadge>
          </div>
          <div className="mt-2 divide-y divide-[var(--border-soft)]">
            <QuickStatRow icon={PhoneCall} label="Today's Calls" value={formatCount(todayCalls)} tone="teal" />
            <QuickStatRow icon={CalendarDays} label="This Week" value={formatCount(thisWeekCalls)} tone="violet" />
            <QuickStatRow icon={RotateCcw} label="Callbacks Requested" value={formatCount(analytics.callbacksRequested)} tone="amber" />
            <QuickStatRow icon={Users} label="Active Agents" value={formatCount(analytics.activeAgents)} tone="emerald" />
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Recent Appointments</div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">Latest activity</h2>
          </div>
          <ArrowLink href="/dashboard/appointments">View All</ArrowLink>
        </div>
        <div className="mt-5 divide-y divide-[var(--border-soft)] overflow-hidden rounded-[24px] border border-[var(--border-soft)] bg-white/78">
          {recentAppointments.length === 0 ? (
            <div className="px-5 py-6 text-sm text-[var(--text-muted)]">No recent appointments yet.</div>
          ) : (
            recentAppointments.map((appointment) => {
              const tone = getAppointmentTone(appointment.status)
              const clientDetails = appointment.client?.dateOfBirth ? `DOB: ${appointment.client.dateOfBirth}` : ''
              return (
                <div key={appointment.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[var(--brand)] text-sm font-semibold text-white shadow-[0_16px_30px_-20px_rgba(21, 57, 142,0.7)]">
                      {appointment.client?.name
                        ?.split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('') ?? '??'}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--text-strong)]">
                        {appointment.client?.name ?? 'Unknown client'}
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-muted)]">{appointment.service?.name ?? 'No service'}{clientDetails ? ` - ${clientDetails}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-left md:items-end md:text-right">
                    <div className="text-xs text-[var(--text-muted)]">{formatAppointmentDateTime(appointment.scheduledAt, timezone)}</div>
                    <StatusBadge tone={tone}>{STATUS_LABEL[appointment.status] ?? appointment.status}</StatusBadge>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SurfaceCard>
    </div>
  )
}

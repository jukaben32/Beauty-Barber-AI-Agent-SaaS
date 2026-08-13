import {
  BarChart3,
  CalendarDays,
  Clock3,
  MessageSquareMore,
  PhoneCall,
  PieChart,
  RotateCcw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppointmentWithRelations, Conversation, DashboardAnalytics } from '@/types'
import { StatusBadge, SurfaceCard } from '@/components/dashboard/shared'
import { getDateKeyInTimeZone, getDayOfWeekInTimeZone } from '@/services/_shared'

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

const TOP_TONES = {
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
} as const

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type ToneKey = keyof typeof TOP_TONES

type DailyPoint = {
  key: string
  label: string
  conversations: number
  appointments: number
}

function formatCount(value: number) {
  return NUMBER_FORMAT.format(value)
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator === 0) return '0%'
  const value = Math.round((numerator / denominator) * 10) / 10
  return `${value.toFixed(Number.isInteger(value) ? 0 : 1)}%`
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function formatTrendLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(date)
}

function formatRelativeDate(iso: string, timeZone: string) {
  const now = new Date()
  const date = new Date(iso)
  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60000)
  const absMinutes = Math.abs(diffMinutes)
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

  if (absMinutes < 60) return rtf.format(Math.sign(diffMinutes) * absMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatExactDate(iso: string, timeZone: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getGreeting(timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(new Date()))
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function buildDailySeries(conversations: Conversation[], appointments: AppointmentWithRelations[], timeZone: string) {
  const conversationBuckets = new Map<string, number>()
  const appointmentBuckets = new Map<string, number>()

  for (const conversation of conversations) {
    const key = getDateKeyInTimeZone(new Date(conversation.startedAt), timeZone)
    conversationBuckets.set(key, (conversationBuckets.get(key) ?? 0) + 1)
  }

  for (const appointment of appointments) {
    if (appointment.status === 'cancelled') continue
    const key = getDateKeyInTimeZone(new Date(appointment.createdAt), timeZone)
    appointmentBuckets.set(key, (appointmentBuckets.get(key) ?? 0) + 1)
  }

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    const key = getDateKeyInTimeZone(date, timeZone)
    return {
      key,
      label: formatTrendLabel(date, timeZone),
      conversations: conversationBuckets.get(key) ?? 0,
      appointments: appointmentBuckets.get(key) ?? 0,
    }
  })
}

function buildWeeklySeries(conversations: Conversation[], appointments: AppointmentWithRelations[], timeZone: string) {
  const now = new Date()
  const currentDow = getDayOfWeekInTimeZone(now, timeZone)
  const mondayOffset = (currentDow + 6) % 7
  const start = new Date(now)
  start.setDate(start.getDate() - mondayOffset)

  const conversationBuckets = new Map<string, number>()
  const appointmentBuckets = new Map<string, number>()

  for (const conversation of conversations) {
    const key = getDateKeyInTimeZone(new Date(conversation.startedAt), timeZone)
    conversationBuckets.set(key, (conversationBuckets.get(key) ?? 0) + 1)
  }

  for (const appointment of appointments) {
    if (appointment.status === 'cancelled') continue
    const key = getDateKeyInTimeZone(new Date(appointment.createdAt), timeZone)
    appointmentBuckets.set(key, (appointmentBuckets.get(key) ?? 0) + 1)
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = getDateKeyInTimeZone(date, timeZone)
    return {
      key,
      label: WEEKDAY_LABELS[index],
      conversations: conversationBuckets.get(key) ?? 0,
      appointments: appointmentBuckets.get(key) ?? 0,
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

function getMonthStartKey(timeZone: string) {
  return getDateKeyInTimeZone(new Date(new Date().getFullYear(), new Date().getMonth(), 1), timeZone)
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  helper?: string
  tone: ToneKey
}) {
  const styles = TOP_TONES[tone]

  return (
    <SurfaceCard className="relative overflow-hidden p-5">
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: styles.accent }} />
      <div className="pl-1">
        <div
          className="grid h-11 w-11 place-items-center rounded-[16px] border"
          style={{ background: styles.soft, borderColor: styles.border, color: styles.color }}
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

function MiniCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  helper: string
  tone: ToneKey
}) {
  const styles = TOP_TONES[tone]

  return (
    <SurfaceCard className="relative overflow-hidden p-5">
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: styles.accent }} />
      <div className="flex items-start justify-between gap-4 pl-1">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text-strong)]">{value}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">{helper}</div>
        </div>
        <div
          className="grid h-10 w-10 place-items-center rounded-[16px] border"
          style={{ background: styles.soft, borderColor: styles.border, color: styles.color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </SurfaceCard>
  )
}

function TrendChart({ series }: { series: DailyPoint[] }) {
  const width = 1000
  const height = 300
  const left = 54
  const right = 24
  const top = 20
  const bottom = 40
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const highestValue = Math.max(1, ...series.map((day) => Math.max(day.conversations, day.appointments)))
  const tickStep = Math.max(1, Math.ceil(highestValue / 4))
  const tickMax = tickStep * 4

  const conversationPoints = series.map((day, index) => {
    const x = left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth)
    const y = top + plotHeight - (day.conversations / tickMax) * plotHeight
    return { x, y }
  })
  const appointmentPoints = series.map((day, index) => {
    const x = left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth)
    const y = top + plotHeight - (day.appointments / tickMax) * plotHeight
    return { x, y }
  })

  const areaPath = buildAreaPath(conversationPoints, top + plotHeight)
  const conversationPath = buildLinePath(conversationPoints)
  const appointmentPath = buildLinePath(appointmentPoints)
  const ticks = Array.from({ length: 5 }, (_, index) => tickMax - index * tickStep)

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,240,231,0.72))] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full overflow-visible" role="img" aria-label="30 day conversation trend">
        <defs>
          <linearGradient id="analytics-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(21, 57, 142,0.24)" />
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
          const showLabel = index % 5 === 0 || index === series.length - 1
          return (
            <g key={day.key}>
              <line x1={x} x2={x} y1={top} y2={top + plotHeight} stroke="rgba(15,33,41,0.04)" />
              {showLabel ? (
                <text x={x} y={height - 12} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 10, fontWeight: 500 }}>
                  {day.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {areaPath ? <path d={areaPath} fill="url(#analytics-trend-fill)" /> : null}
        {conversationPath ? <path d={conversationPath} fill="none" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {appointmentPath ? <path d={appointmentPath} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {conversationPoints.length > 0 ? (
          <circle
            cx={conversationPoints[conversationPoints.length - 1].x}
            cy={conversationPoints[conversationPoints.length - 1].y}
            r="5"
            fill="white"
            stroke="var(--brand)"
            strokeWidth="3"
          />
        ) : null}
        {appointmentPoints.length > 0 ? (
          <circle
            cx={appointmentPoints[appointmentPoints.length - 1].x}
            cy={appointmentPoints[appointmentPoints.length - 1].y}
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

function DonutChart({
  booked,
  noAction,
  conversionRate,
}: {
  booked: number
  noAction: number
  conversionRate: string
}) {
  const total = Math.max(1, booked + noAction)
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const bookedDash = circumference * (booked / total)
  const noActionDash = circumference - bookedDash

  return (
    <div className="rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(247,240,231,0.72))] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Outcome Split</div>
          <h3 className="mt-2 font-display text-lg font-semibold tracking-[-0.04em] text-[var(--text-strong)]">Appointments vs no action</h3>
        </div>
        <StatusBadge tone="slate">This month</StatusBadge>
      </div>
      <div className="mt-6 flex items-center justify-center">
        <svg viewBox="0 0 220 220" className="h-56 w-56">
          <g transform="rotate(-90 110 110)">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(15,33,41,0.08)" strokeWidth="18" />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${bookedDash} ${circumference - bookedDash}`}
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${noActionDash} ${circumference - noActionDash}`}
              strokeDashoffset={-bookedDash}
            />
          </g>
          <text x="110" y="104" textAnchor="middle" className="fill-[var(--text-muted)]" style={{ fontSize: 12, fontWeight: 600 }}>
            Conversion
          </text>
          <text x="110" y="136" textAnchor="middle" className="fill-[var(--text-strong)]" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.05em' }}>
            {conversionRate}
          </text>
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
          Booked {formatCount(booked)}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
          No action {formatCount(noAction)}
        </div>
      </div>
    </div>
  )
}

function WeeklyBreakdown({ series }: { series: DailyPoint[] }) {
  const highestValue = Math.max(1, ...series.flatMap((day) => [day.conversations, day.appointments]))

  return (
    <SurfaceCard className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">This Week - Daily Breakdown</div>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">Daily conversations and bookings</h3>
        </div>
        <StatusBadge tone="teal">Mon-Sun</StatusBadge>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-3">
        {series.map((day) => {
          const conversationsHeight = Math.max(6, Math.round((day.conversations / highestValue) * 100))
          const appointmentsHeight = Math.max(6, Math.round((day.appointments / highestValue) * 100))
          return (
            <div key={day.key} className="group flex flex-col items-center gap-3">
              <div className="relative flex h-56 w-full items-end justify-center rounded-[20px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-2 pb-3 pt-4">
                <div className="pointer-events-none absolute bottom-[calc(100%+10px)] z-10 w-max rounded-2xl border border-[var(--border-soft)] bg-white px-3 py-2 text-left text-[11px] font-medium text-[var(--text-strong)] opacity-0 shadow-[0_20px_40px_-28px_rgba(15,33,41,0.55)] transition group-hover:opacity-100">
                  <div className="font-semibold text-[var(--text-strong)]">{day.label}</div>
                  <div className="mt-1 text-[var(--brand-strong)]">Conversations: {day.conversations}</div>
                  <div className="mt-1 text-[#7c3aed]">Appointments: {day.appointments}</div>
                </div>
                <div className="flex h-full w-full items-end justify-center gap-2">
                  <div
                    className="w-6 rounded-t-[10px]"
                    style={{ height: `${conversationsHeight}%`, background: 'var(--brand)' }}
                    title={`${day.label}: ${day.conversations} conversations`}
                  />
                  <div
                    className="w-6 rounded-t-[10px]"
                    style={{ height: `${appointmentsHeight}%`, background: '#7c3aed' }}
                    title={`${day.label}: ${day.appointments} appointments`}
                  />
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[var(--text-muted)]">{day.label}</div>
            </div>
          )
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
          Conversations
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
          Appointments
        </div>
      </div>
    </SurfaceCard>
  )
}

export function AnalyticsManager({
  analytics,
  conversations,
  appointments,
  timezone,
  businessName,
}: {
  analytics: DashboardAnalytics
  conversations: Conversation[]
  appointments: AppointmentWithRelations[]
  timezone: string
  businessName: string
}) {
  const now = new Date()
  const totalConversations = analytics.totalConversations || conversations.length
  const bookedConversations = analytics.bookedConversations || conversations.filter((conversation) => conversation.outcome === 'booked_appointment').length
  const noAction = Math.max(0, totalConversations - bookedConversations)
  const conversionRate = formatPercent(bookedConversations, totalConversations)
  const avgCallDuration = formatDuration(
    conversations.length > 0
      ? conversations.reduce((sum, conversation) => sum + (conversation.durationSeconds || 0), 0) / conversations.length
      : 0,
  )
  const dailySeries = buildDailySeries(conversations, appointments, timezone)
  const weeklySeries = buildWeeklySeries(conversations, appointments, timezone)
  const todayKey = getDateKeyInTimeZone(now, timezone)
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - ((getDayOfWeekInTimeZone(now, timezone) + 6) % 7))
  const monthStartKey = getMonthStartKey(timezone)

  const todayAppointments = appointments.filter((appt) => {
    if (appt.status === 'cancelled') return false
    return getDateKeyInTimeZone(new Date(appt.scheduledAt), timezone) === todayKey
  }).length

  const thisWeekAppointments = appointments.filter((appt) => {
    if (appt.status === 'cancelled') return false
    return getDateKeyInTimeZone(new Date(appt.scheduledAt), timezone) >= getDateKeyInTimeZone(weekStart, timezone)
  }).length

  const thisMonthAppointments = appointments.filter((appt) => {
    if (appt.status === 'cancelled') return false
    return getDateKeyInTimeZone(new Date(appt.scheduledAt), timezone) >= monthStartKey
  }).length

  const todayConversations = conversations.filter((conversation) => getDateKeyInTimeZone(new Date(conversation.startedAt), timezone) === todayKey).length
  const thisWeekConversations = conversations.filter((conversation) => getDateKeyInTimeZone(new Date(conversation.startedAt), timezone) >= getDateKeyInTimeZone(weekStart, timezone)).length
  const thisMonthConversations = conversations.filter((conversation) => getDateKeyInTimeZone(new Date(conversation.startedAt), timezone) >= monthStartKey).length

  const topCards = [
    {
      label: 'Total Conversations',
      value: formatCount(totalConversations),
      helper: 'Across phone, widget, and chat',
      icon: MessageSquareMore,
      tone: 'teal' as const,
    },
    {
      label: 'Appointments Booked',
      value: formatCount(bookedConversations),
      helper: 'Booking outcomes from the agent',
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
      helper: 'Average recorded call length',
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
              Analytics
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-[var(--text-strong)] md:text-5xl">
              Performance insights and trends
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)] md:text-base">
              Review conversations, bookings, and business activity in real time. The shapes below mirror the reference flow: trend, outcome split, and weekly breakdown.
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
            <StatusBadge tone="slate">{businessName}</StatusBadge>
            <StatusBadge tone="teal">{formatCount(analytics.activeAgents)} active agents</StatusBadge>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.38fr_0.82fr]">
        <SurfaceCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">30-Day Trend</div>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">Conversation flow and bookings</h2>
            </div>
            <StatusBadge tone="teal">Last 30 days</StatusBadge>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
              Conversations
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
              Appointments
            </div>
          </div>
          <div className="mt-5">
            <TrendChart series={dailySeries} />
          </div>
        </SurfaceCard>

        <DonutChart booked={bookedConversations} noAction={noAction} conversionRate={conversionRate} />
      </div>

      <WeeklyBreakdown series={weeklySeries} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniCard icon={PhoneCall} label="Today" value={formatCount(todayAppointments)} helper={`${formatCount(todayConversations)} calls`} tone="teal" />
        <MiniCard icon={CalendarDays} label="This Week" value={formatCount(thisWeekAppointments)} helper={`${formatCount(thisWeekConversations)} calls`} tone="emerald" />
        <MiniCard icon={BarChart3} label="This Month" value={formatCount(thisMonthAppointments)} helper={`${formatCount(thisMonthConversations)} calls`} tone="violet" />
        <MiniCard icon={RotateCcw} label="Callbacks Requested" value={formatCount(analytics.callbacksRequested)} helper="Escalated conversations" tone="amber" />
      </div>
    </div>
  )
}

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Sparkles,
} from 'lucide-react'

import { cn, formatCurrency } from '@/lib/utils'

type Tone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

type ToneClasses = {
  badge: string
  dot: string
  glow: string
}

// "Industry" design system: no decorative per-status colors. Every tone
// resolves to either the single accent (positive/active states) or a
// neutral gray (inactive/default states); rose keeps the muted --coral so
// destructive/negative states stay legible without adding a second color.
const toneMap: Record<Tone, ToneClasses> = {
  teal: {
    badge: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
    dot: 'bg-[var(--brand)]',
    glow: 'shadow-[2px_2px_0_0_var(--brand)]',
  },
  emerald: {
    badge: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
    dot: 'bg-[var(--brand)]',
    glow: 'shadow-[2px_2px_0_0_var(--brand)]',
  },
  blue: {
    badge: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
    dot: 'bg-[var(--brand)]',
    glow: 'shadow-[2px_2px_0_0_var(--brand)]',
  },
  amber: {
    badge: 'border-[var(--border-strong)] bg-[var(--panel-soft)] text-[var(--text-strong)]',
    dot: 'bg-[var(--text-muted)]',
    glow: 'shadow-[2px_2px_0_0_var(--border-soft)]',
  },
  rose: {
    badge: 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--coral)]',
    dot: 'bg-[var(--coral)]',
    glow: 'shadow-[2px_2px_0_0_var(--border-soft)]',
  },
  slate: {
    badge: 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]',
    dot: 'bg-[var(--text-muted)]',
    glow: 'shadow-[2px_2px_0_0_var(--border-soft)]',
  },
}

export function BrandMark({
  compact = false,
}: {
  compact?: boolean
  tone?: Tone
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'relative grid shrink-0 place-items-center overflow-hidden text-white',
          compact ? 'h-9 w-9 rounded-[14px]' : 'h-10 w-10 rounded-[16px]',
        )}
        style={{
          background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))',
          boxShadow: '0 18px 36px -24px rgba(19, 122, 114, 0.7)',
        }}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.36),transparent_55%)]" />
        <Sparkles className="relative h-4 w-4" />
      </div>
      {!compact ? (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
            Clara AI
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            clinical reception stack
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/75 px-3.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)] backdrop-blur-sm">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)] animate-pulse-slow" />
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  actions,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  actions?: ReactNode
  }) {
  return (
    <div className={cn('flex flex-col gap-4', align === 'center' && 'items-center text-center')}>
      {eyebrow ? <div>{eyebrow}</div> : null}
      <div className={cn('max-w-3xl', align === 'center' && 'mx-auto')}>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)] md:text-4xl">
          {title}
        </h2>
      </div>
      {description ? (
        <p className={cn('max-w-2xl text-base leading-7 text-[var(--text-muted)]', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      ) : null}
      {actions ? <div className={cn('flex flex-wrap gap-3', align === 'center' && 'justify-center')}>{actions}</div> : null}
    </div>
  )
}

export function SurfaceCard({
  children,
  className,
  style,
  glow = false,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  glow?: boolean
  }) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,239,230,0.9))]',
        glow && 'border-[var(--border-strong)]',
        className,
      )}
      style={{
        boxShadow: glow
          ? '0 24px 72px -44px rgba(19, 122, 114, 0.42)'
          : '0 18px 60px -42px rgba(15, 33, 41, 0.34)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = 'teal',
}: {
  label: string
  value: string
  delta?: string
  icon: LucideIcon
  tone?: Tone
}) {
  const toneClasses = toneMap[tone]
  return (
    <SurfaceCard className="relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: 'linear-gradient(90deg, var(--brand), rgba(19, 122, 114, 0.28))' }} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
            {label}
          </div>
          <div className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
            {value}
          </div>
          {delta ? <div className="mt-2 text-sm font-medium text-[var(--brand-strong)]">{delta}</div> : null}
        </div>
        <div className={cn('grid h-12 w-12 place-items-center rounded-[16px] border p-3', toneClasses.badge)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </SurfaceCard>
  )
}

export function StatusBadge({
  children,
  tone = 'teal',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        toneMap[tone].badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', toneMap[tone].dot)} />
      {children}
    </span>
  )
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  icon = 'arrow',
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: 'arrow' | 'calendar' | 'check' | 'none'
}) {
  const styles =
    variant === 'primary'
      ? 'text-white'
      : variant === 'secondary'
        ? 'border border-[var(--border-soft)] bg-white/72 text-[var(--text-strong)] backdrop-blur-sm hover:bg-white/92'
        : 'bg-transparent text-[var(--text-strong)] hover:bg-white/55'

  const Icon = icon === 'calendar' ? CalendarDays : icon === 'check' ? CheckCircle2 : ArrowUpRight

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm font-semibold tracking-[0.02em] transition duration-200 hover:-translate-y-0.5',
        styles,
      )}
      style={
        variant === 'primary'
          ? {
              background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))',
              boxShadow: '0 18px 40px -24px rgba(19, 122, 114, 0.65)',
            }
          : undefined
      }
    >
      {children}
      {icon !== 'none' ? <Icon className="h-4 w-4" /> : null}
    </Link>
  )
}

export function Pill({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        toneMap[tone].badge,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function BrowserFrame({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  accent?: Tone
  children: ReactNode
  }) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,239,230,0.92))] shadow-[0_26px_80px_-52px_rgba(15,33,41,0.45)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg, #102129 0%, #17313a 100%)' }}>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
          {title}
        </div>
        <div className="w-16" />
      </div>
      <div className="bg-[rgba(255,255,255,0.62)] p-4 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[24px] border border-[var(--border-soft)] bg-white/78 px-4 py-3 backdrop-blur-sm">
          <div>
            <div className="text-sm font-semibold text-[var(--text-strong)]">{title}</div>
            {subtitle ? <div className="text-xs text-[var(--text-muted)]">{subtitle}</div> : null}
          </div>
          <div className="h-2 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, var(--brand), var(--brand-strong))' }} />
        </div>
        {children}
      </div>
    </div>
  )
}

export function PhoneFrame({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  accent?: Tone
  children: ReactNode
  }) {
  return (
    <div className="w-full max-w-[340px] rounded-[36px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,240,231,0.92))] p-3 shadow-[0_26px_80px_-52px_rgba(15,33,41,0.45)]">
      <div className="overflow-hidden rounded-[28px] bg-[var(--panel)]">
        <div className="px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }}>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] opacity-85">{title}</div>
          {subtitle ? <div className="text-[11px] opacity-90">{subtitle}</div> : null}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function AvatarStack({
  names,
  label,
}: {
  names: string[]
  label?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {names.slice(0, 5).map((name) => (
          <div
            key={name}
            className="grid h-9 w-9 place-items-center rounded-full border-2 text-[11px] font-bold text-white"
            style={{ background: 'var(--brand)', borderColor: 'var(--page-bg)' }}
            title={name}
          >
            {name
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')}
          </div>
        ))}
      </div>
      {label ? <div className="text-sm font-medium text-[var(--text-muted)]">{label}</div> : null}
    </div>
  )
}

export function ProgressRail({
  value,
  label,
}: {
  value: number
  label: string
  tone?: Tone
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-strong)]">{label}</span>
        <span className="font-bold text-[var(--text-muted)]">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[rgba(16,33,41,0.08)]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg, var(--brand), var(--brand-strong))' }} />
      </div>
    </div>
  )
}

export function TimelineList({
  items,
}: {
  items: Array<{
    time: string
    title: string
    description?: string
    tone?: Tone
  }>
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={`${item.time}-${item.title}`} className="flex gap-4">
          <div className="mt-1 w-16 shrink-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {item.time}
          </div>
          <div className={cn('relative flex-1 rounded-[22px] border border-[var(--border-soft)] bg-white/80 px-4 py-3 backdrop-blur-sm', item.tone && toneMap[item.tone].glow)}>
            <div className="flex items-center justify-between gap-4">
              <div className="font-semibold text-[var(--text-strong)]">{item.title}</div>
              <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
            {item.description ? <div className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</div> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SimpleTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: ReactNode[][]
  }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--border-soft)] bg-white/82 backdrop-blur-sm">
      <div
        className="grid gap-3 border-b border-[var(--border-soft)] bg-[rgba(16,33,41,0.04)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column}>
            {column}
          </div>
        ))}
      </div>
      <div className="divide-y divide-[var(--border-soft)]">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3 px-5 py-4 text-sm text-[var(--text-strong)]"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {row.map((cell, cellIndex) => (
              <div key={cellIndex}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeatureCard({
  icon: Icon,
  title,
  body,
  tone = 'teal',
}: {
  icon: LucideIcon
  title: string
  body: string
  tone?: Tone
  }) {
  return (
    <SurfaceCard className="relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--brand),rgba(19,122,114,0.18))]" />
      <Icon className="h-6 w-6" style={{ color: 'var(--brand)' }} />
      <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{body}</p>
    </SurfaceCard>
  )
}

export function QuoteCard({
  quote,
  author,
  role,
}: {
  quote: string
  author: string
  role: string
}) {
  return (
    <SurfaceCard className="p-6">
      <div className="mb-4 flex gap-0.5" style={{ color: 'var(--brand)' }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Sparkles key={index} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <p className="text-sm leading-7 text-[var(--text-strong)]">&ldquo;{quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }}>
          {author
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--text-strong)]">{author}</div>
          <div className="text-xs text-[var(--text-muted)]">{role}</div>
        </div>
      </div>
    </SurfaceCard>
  )
}

export function ValueCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = 'teal',
}: {
  label: string
  value: string
  subtitle?: string
  icon: LucideIcon
  tone?: Tone
  }) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">{label}</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{value}</div>
          {subtitle ? <div className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</div> : null}
        </div>
        <Icon className="h-5 w-5 shrink-0" style={{ color: 'var(--brand)' }} />
      </div>
    </SurfaceCard>
  )
}

export function PriceBlock({
  label,
  amount,
  currency = 'USD',
  helper,
}: {
  label: string
  amount: number
  currency?: string
  helper?: string
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/82 p-5 backdrop-blur-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
        {formatCurrency(amount, currency)}
      </div>
      {helper ? <div className="mt-2 text-sm text-[var(--text-muted)]">{helper}</div> : null}
    </div>
  )
}

export function ArrowLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)] transition hover:text-[var(--brand-strong)]">
      {children}
      <ChevronRight className="h-4 w-4" />
    </Link>
  )
}

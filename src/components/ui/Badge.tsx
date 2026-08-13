import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BadgeTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

const toneClasses: Record<BadgeTone, string> = {
  teal: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  emerald: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  blue: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--coral)]',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  tone?: BadgeTone
}

export default function Badge({ children, tone = 'slate', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]', toneClasses[tone], className)}
      {...props}
    >
      {children}
    </span>
  )
}

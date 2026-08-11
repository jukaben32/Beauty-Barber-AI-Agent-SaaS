import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BadgeTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

const toneClasses: Record<BadgeTone, string> = {
  teal: 'border-teal-200 bg-teal-50 text-teal-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  blue: 'border-sky-200 bg-sky-50 text-sky-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
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

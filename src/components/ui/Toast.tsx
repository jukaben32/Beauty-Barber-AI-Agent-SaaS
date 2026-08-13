"use client"

import type { ReactNode } from 'react'
import { CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/utils'

type ToastTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

type ToastProps = {
  title: string
  message?: string
  tone?: ToastTone
  action?: ReactNode
  onClose?: () => void
}

const toneClasses: Record<ToastTone, string> = {
  teal: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  emerald: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  blue: 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--coral)]',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

export default function Toast({ title, message, tone = 'teal', action, onClose }: ToastProps) {
  return (
    <div className={cn('flex items-start gap-3 rounded-[24px] border px-4 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)]', toneClasses[tone])}>
      <div className="mt-0.5">{tone === 'amber' ? <Info className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{title}</div>
        {message ? <div className="mt-1 text-sm leading-6 opacity-90">{message}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
      {onClose ? (
        <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

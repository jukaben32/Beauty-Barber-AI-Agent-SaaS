import type { ReactNode, TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode
  hint?: ReactNode
}

export default function Textarea({ label, hint, className, ...props }: TextareaProps) {
  return (
    <label className="block space-y-2">
      {label ? <div className="text-sm font-semibold text-[var(--text-strong)]">{label}</div> : null}
      <textarea className={cn('input-field min-h-[140px] resize-y', className)} {...props} />
      {hint ? <div className="text-xs text-[var(--text-muted)]">{hint}</div> : null}
    </label>
  )
}

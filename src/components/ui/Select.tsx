import type { HTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode
  hint?: ReactNode
}

export default function Select({ label, hint, className, children, ...props }: SelectProps) {
  return (
    <label className="block space-y-2">
      {label ? <div className="text-sm font-semibold text-[var(--text-strong)]">{label}</div> : null}
      <select className={cn('input-field', className)} {...props}>
        {children}
      </select>
      {hint ? <div className="text-xs text-[var(--text-muted)]">{hint}</div> : null}
    </label>
  )
}

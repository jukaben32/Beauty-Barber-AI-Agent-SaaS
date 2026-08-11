import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode
  hint?: ReactNode
}

export default function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="block space-y-2">
      {label ? <div className="text-sm font-semibold text-[var(--text-strong)]">{label}</div> : null}
      <input
        className={cn(
          'input-field',
          className,
        )}
        {...props}
      />
      {hint ? <div className="text-xs text-[var(--text-muted)]">{hint}</div> : null}
    </label>
  )
}

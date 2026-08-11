"use client"

import { cn } from '@/lib/utils'

type ToggleProps = {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
}

export default function Toggle({ checked, onCheckedChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange?.(!checked)}
      className="inline-flex items-center gap-3"
      aria-pressed={checked}
    >
      {label ? <span className="text-sm font-medium text-[var(--text-strong)]">{label}</span> : null}
      <span
        className={cn(
          'relative inline-flex h-7 w-12 items-center rounded-full border transition',
          checked ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-slate-200',
        )}
      >
        <span
          className={cn(
            'absolute h-5 w-5 rounded-full bg-white shadow transition',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}

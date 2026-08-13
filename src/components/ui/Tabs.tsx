"use client"

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TabItem = {
  label: string
  value: string
}

type TabsProps = {
  items: TabItem[]
  value: string
  onChange?: (value: string) => void
  children?: ReactNode
}

export default function Tabs({ items, value, onChange, children }: TabsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange?.(item.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              item.value === value
                ? 'bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(21, 57, 142,0.2)]'
                : 'bg-white text-[var(--text-muted)] hover:bg-[var(--brand-soft)] hover:text-[var(--text-strong)]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}

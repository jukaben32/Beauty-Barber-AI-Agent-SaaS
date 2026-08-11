import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('rounded-[28px] border border-[var(--border-soft)] bg-[var(--panel)] shadow-[0_20px_60px_rgba(15,23,42,0.06)]', className)} {...props}>
      {children}
    </div>
  )
}

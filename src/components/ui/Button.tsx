import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = {
  children: ReactNode
  href?: string
  variant?: ButtonVariant
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand)] text-white shadow-[0_14px_32px_rgba(15,118,110,0.22)] hover:bg-[var(--brand-strong)]',
  secondary:
    'border border-[var(--border-soft)] bg-white text-[var(--text-strong)] hover:bg-[var(--panel-soft)]',
  ghost: 'bg-transparent text-[var(--text-strong)] hover:bg-white/70',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
}

export default function Button({
  children,
  href,
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[variant],
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

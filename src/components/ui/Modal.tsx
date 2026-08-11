"use client"

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

type ModalProps = {
  open: boolean
  title?: string
  description?: string
  children: ReactNode
  onClose: () => void
  className?: string
}

export default function Modal({ open, title, description, children, onClose, className }: ModalProps) {
  useEffect(() => {
    if (!open) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      role="presentation"
    >
      <div
        className={cn(
          'mx-auto my-6 w-full max-w-lg rounded-[30px] border border-[var(--border-soft)] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]',
          className,
        )}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-soft)] px-6 py-5">
          <div>
            {title ? <h3 className="text-xl font-black tracking-tight text-[var(--text-strong)]">{title}</h3> : null}
            {description ? <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white text-[var(--text-strong)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  )
}

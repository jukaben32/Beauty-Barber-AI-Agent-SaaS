import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'

import { cn } from '@/lib/utils'

type FilePreviewProps = {
  name: string
  description?: string
  meta?: ReactNode
  className?: string
}

export default function FilePreview({ name, description, meta, className }: FilePreviewProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 rounded-[24px] border border-[var(--border-soft)] bg-white px-4 py-3', className)}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--text-strong)]">{name}</div>
          {description ? <div className="text-xs text-[var(--text-muted)]">{description}</div> : null}
        </div>
      </div>
      {meta ? <div>{meta}</div> : null}
    </div>
  )
}

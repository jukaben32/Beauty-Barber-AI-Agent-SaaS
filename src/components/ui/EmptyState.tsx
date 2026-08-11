import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

import { ButtonLink, SurfaceCard } from '@/components/dashboard/shared'

type EmptyStateProps = {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  icon?: ReactNode
}

export default function EmptyState({ title, description, actionHref, actionLabel, icon }: EmptyStateProps) {
  return (
    <SurfaceCard className="p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-5 text-2xl font-black tracking-tight text-[var(--text-strong)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-6">
          <ButtonLink href={actionHref} icon="none">
            {actionLabel}
          </ButtonLink>
        </div>
      ) : null}
    </SurfaceCard>
  )
}

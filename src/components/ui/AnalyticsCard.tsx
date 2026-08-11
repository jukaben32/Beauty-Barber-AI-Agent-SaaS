import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { MetricCard } from '@/components/dashboard/shared'

type AnalyticsCardProps = {
  label: string
  value: string
  delta?: string
  icon: LucideIcon
  tone?: 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'
}

export default function AnalyticsCard(props: AnalyticsCardProps) {
  return <MetricCard {...props} />
}

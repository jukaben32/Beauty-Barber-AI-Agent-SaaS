import type { PlanId, PlanLimits } from '@/types'

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    name: process.env.NEXT_PUBLIC_FREE_PLAN_NAME ?? 'Free',
    priceUsd: 0,
    agentLimit: Number(process.env.NEXT_PUBLIC_FREE_AGENT_LIMIT ?? 1),
  },
  pro: {
    id: 'pro',
    name: process.env.NEXT_PUBLIC_PRO_PLAN_NAME ?? 'Pro',
    priceUsd: Number(process.env.NEXT_PUBLIC_PRO_PLAN_PRICE_USD ?? 49),
    agentLimit: Number(process.env.NEXT_PUBLIC_PRO_AGENT_LIMIT ?? 10),
  },
  business: {
    id: 'business',
    name: process.env.NEXT_PUBLIC_BUSINESS_PLAN_NAME ?? 'Business',
    priceUsd: Number(process.env.NEXT_PUBLIC_BUSINESS_PLAN_PRICE_USD ?? 199),
    agentLimit: Number(process.env.NEXT_PUBLIC_BUSINESS_AGENT_LIMIT ?? 0),
  },
}

export const WEBSITE_BUILDER_PRICE_USD = Number(process.env.NEXT_PUBLIC_WEBSITE_BUILDER_PRICE_USD ?? 29)

export const WEBSITE_BUILDER_FEATURES = [
  '3 professional website templates',
  'Full content & brand editor',
  'AI voice widget embedded',
  'Published at your custom URL',
  'Renew anytime — cancel anytime',
] as const

// 0 means "unlimited" in the env contract.
export function isWithinLimit(used: number, limit: number): boolean {
  return limit === 0 || used < limit
}

export const DEFAULT_TIME_ZONE = 'America/Santo_Domingo'
export const DEFAULT_WELCOME_MESSAGE = 'Hola, soy Clara, tu asistente medica virtual. En que te ayudo hoy?'
export const DEFAULT_WIDGET_WIDTH = 420
export const DEFAULT_WIDGET_HEIGHT = 680
export const DEFAULT_APPOINTMENT_SLOT_MINUTES = 30
export const DEFAULT_CURRENCY = 'DOP'
export const LOCAL_PAYMENT_METHODS = ['cash', 'transfer', 'card_cardnet', 'card_azul'] as const
export const DEFAULT_CHAIN_ID = 137
export const DEFAULT_PRIMARY_COLOR = '#0f766e'
export const DEFAULT_SECONDARY_COLOR = '#14b8a6'
export const DEFAULT_WIDGET_TONE = 'professional-and-friendly'
export const DEFAULT_SITE_FONT = 'Manrope'

export const APPOINTMENT_STATUSES = ['scheduled', 'pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show'] as const
export const PAYMENT_STATUSES = ['not_required', 'pending', 'partial', 'paid', 'cash', 'refunded'] as const
export const SUPPORT_STATUSES = ['open', 'pending', 'resolved', 'closed'] as const
export const AGENT_STATUSES = ['draft', 'live', 'paused'] as const
export const SERVICE_PRICE_TYPES = ['fixed', 'starting_at', 'contact'] as const
export const CONVERSATION_OUTCOMES = ['booked_appointment', 'qualified_lead', 'no_action', 'escalated'] as const
export const CONVERSATION_CHANNELS = ['widget_voice', 'widget_chat', 'phone', 'whatsapp'] as const
export const NOTIFICATION_CATEGORIES = ['appointment', 'billing', 'widget', 'support', 'system'] as const
export const WEBSITE_TEMPLATES = ['serenity', 'pulse', 'clarity'] as const
export const BILLING_TRANSACTION_STATUSES = ['pending', 'confirmed', 'failed', 'refunded'] as const
export const BILLING_PAYMENT_TYPES = ['booking_deposit', 'full_payment', 'subscription', 'portal_topup'] as const
export const BUSINESS_MEMBER_ROLES = ['owner', 'admin', 'staff', 'assistant'] as const

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const DEFAULT_BUSINESS_ONBOARDING_STEP = 'created' as const

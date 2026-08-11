export const DEFAULT_TIME_ZONE = 'America/New_York'
export const DEFAULT_WELCOME_MESSAGE = 'Hola, soy Clara, tu asistente medica virtual. En que te ayudo hoy?'
export const DEFAULT_WIDGET_WIDTH = 420
export const DEFAULT_WIDGET_HEIGHT = 680
export const DEFAULT_APPOINTMENT_SLOT_MINUTES = 30
export const DEFAULT_CURRENCY = 'USDC'
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

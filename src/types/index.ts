import type { Json } from './database'

export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise'
export type BusinessOnboardingStep = 'created' | 'profile' | 'agent' | 'services' | 'billing' | 'done'
export type BusinessMemberRole = 'owner' | 'admin' | 'staff' | 'assistant'
export type AgentStatus = 'draft' | 'live' | 'paused'
export type ServicePriceType = 'fixed' | 'starting_at' | 'contact'
export type AppointmentStatus = 'scheduled' | 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'not_required' | 'pending' | 'partial' | 'paid' | 'cash' | 'refunded'
export type AppointmentSource = 'widget' | 'portal' | 'manual' | 'ai_call' | 'phone' | 'whatsapp'
export type ConversationChannel = 'widget_voice' | 'widget_chat' | 'phone' | 'whatsapp'
export type ConversationStatus = 'in_progress' | 'completed' | 'failed'
export type ConversationOutcome = 'booked_appointment' | 'qualified_lead' | 'no_action' | 'escalated'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type SupportTicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type SupportSenderType = 'client' | 'staff' | 'system'
export type NotificationCategory = 'appointment' | 'billing' | 'widget' | 'support' | 'system'
export type BillingTransactionStatus = 'pending' | 'confirmed' | 'failed' | 'refunded'
export type BillingPaymentType = 'booking_deposit' | 'full_payment' | 'subscription' | 'portal_topup'
export type WebsiteTemplate = 'serenity' | 'pulse' | 'clarity'

export interface Business {
  id: string
  ownerId: string
  name: string
  slug: string
  specialty: string | null
  description: string | null
  logoUrl: string | null
  phone: string | null
  contactEmail: string | null
  bookingEmail: string | null
  address: string | null
  website: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  timezone: string
  paymentWalletAddress: string | null
  paymentChainId: number | null
  paymentCurrency: string
  bookingDepositAmount: number | null
  onboardingStep: BusinessOnboardingStep
  createdAt: string
  updatedAt: string
}

export interface BusinessMember {
  id: string
  businessId: string
  userId: string
  role: BusinessMemberRole
  createdAt: string
  updatedAt: string
}

export interface BusinessSubscription {
  id: string
  businessId: string
  plan: PlanId
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  websiteBuilderEnabled: boolean
  billingEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AiAgent {
  id: string
  businessId: string
  name: string
  title: string | null
  specialty: string | null
  voice: string
  personality: string
  sensitivity: number
  greetingMessage: string
  systemPrompt: string
  assignedServiceIds?: string[]
  templateKey?: string | null
  status: AgentStatus
  language: string
  callsHandled: number
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  businessId: string
  name: string
  description: string | null
  durationMinutes: number
  priceType: ServicePriceType
  price: number | null
  priceMin: number | null
  priceMax: number | null
  currency: string
  active: boolean
  color: string | null
  instructions: string | null
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  businessId: string
  authUserId: string | null
  name: string
  phone: string | null
  email: string | null
  dateOfBirth: string | null
  notes: string | null
  source: 'ai_call' | 'widget_chat' | 'manual' | 'portal' | 'website_form' | 'whatsapp'
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  businessId: string
  clientId: string | null
  agentId: string | null
  serviceId: string | null
  conversationId: string | null
  scheduledAt: string
  status: AppointmentStatus
  source: AppointmentSource
  notes: string | null
  rescheduledFrom: string | null
  requestedScheduledAt: string | null
  rescheduleRequestedAt: string | null
  confirmedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  cancelledBy: 'client' | 'business' | 'system' | null
  paymentStatus: PaymentStatus
  paymentAmount: number | null
  paymentCurrency: string
  paymentChainId: number | null
  paymentTxHash: string | null
  reminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AppointmentWithRelations extends Appointment {
  client?: Client | null
  service?: Service | null
  agent?: AiAgent | null
}

export interface BusinessAvailability {
  id: string
  businessId: string
  dayOfWeek: number
  isActive: boolean
  openTime: string
  closeTime: string
  breakStart: string | null
  breakEnd: string | null
  slotMinutes: number
  createdAt: string
  updatedAt: string
}

export interface ClosedDate {
  id: string
  businessId: string
  blockedDate: string
  reason: string | null
  createdAt: string
}

export interface Conversation {
  id: string
  businessId: string
  agentId: string | null
  clientId: string | null
  appointmentId: string | null
  channel: ConversationChannel
  status: ConversationStatus
  outcome: ConversationOutcome | null
  sentiment: Sentiment | null
  durationSeconds: number
  transcriptSummary: string | null
  startedAt: string
  endedAt: string | null
  createdAt: string
}

export interface ConversationMessage {
  id: string
  conversationId: string
  businessId: string
  role: 'agent' | 'caller' | 'system'
  content: string
  createdAt: string
}

export interface KnowledgeDocument {
  id: string
  businessId: string
  title: string
  question: string | null
  answer: string | null
  category: string | null
  catalogKey: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Widget {
  id: string
  businessId: string
  agentId: string | null
  name: string
  slug: string
  enabled: boolean
  position: string
  theme: string
  primaryColor: string
  secondaryColor: string
  tone: string
  welcomeMessage: string
  allowedOrigins: string[]
  slotDuration: number
  showBranding: boolean
  impressions: number
  interactions: number
  createdAt: string
  updatedAt: string
}

export interface Website {
  id: string
  businessId: string
  agentId: string | null
  slug: string
  template: WebsiteTemplate
  published: boolean
  primaryColor: string
  secondaryColor: string
  font: string
  logoUrl: string | null
  siteTitle: string
  siteDescription: string
  heroHeadline: string | null
  heroSubheadline: string | null
  heroImageUrl: string | null
  ctaPrimaryText: string
  ctaSecondaryText: string
  aboutTitle: string
  aboutStory: string | null
  aboutPhotoUrl: string | null
  footerTagline: string | null
  footerCopyright: string | null
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null
  contactHours: string | null
  contactMapsUrl: string | null
  yearsExperience: number | null
  clientsServed: number | null
  satisfactionPct: number | null
  trustBadges: string[]
  featuredServiceIds: string[]
  socialYoutube: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  socialTiktok: string | null
  socialLinkedin: string | null
  socialPinterest: string | null
  createdAt: string
  updatedAt: string
}

export interface WhatsappConnection {
  id: string
  business_id: string
  agent_id: string | null
  provider: 'evolution'
  instance_name: string
  instance_token: string | null
  phone_number: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface WebsiteService {
  id: string
  businessId: string
  icon: string
  name: string
  description: string | null
  duration: string | null
  price: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface WebsiteTeamMember {
  id: string
  businessId: string
  name: string
  role: string
  bio: string | null
  photoUrl: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface WebsiteTestimonial {
  id: string
  businessId: string
  quote: string
  authorName: string
  authorRole: string | null
  rating: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface WebsiteSpecialty {
  id: string
  businessId: string
  label: string
  sortOrder: number
  createdAt: string
}

export interface WebsiteFaq {
  id: string
  businessId: string
  question: string
  answer: string
  sortOrder: number
  createdAt: string
}

export interface WebsiteContent {
  website: Website
  services: WebsiteService[]
  teamMembers: WebsiteTeamMember[]
  testimonials: WebsiteTestimonial[]
  specialties: WebsiteSpecialty[]
  faqs: WebsiteFaq[]
}

export interface WebsiteSubscriber {
  id: string
  businessId: string
  email: string
  name: string | null
  phone: string | null
  message: string | null
  source: string
  createdAt: string
}

export interface SupportTicket {
  id: string
  businessId: string
  clientId: string | null
  appointmentId: string | null
  subject: string
  description: string | null
  status: SupportTicketStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  client?: {
    name: string
    email: string | null
    phone: string | null
  } | null
  appointment?: {
    id: string
    scheduledAt: string
    status: AppointmentStatus
  } | null
}

export interface SupportMessage {
  id: string
  ticketId: string
  businessId: string
  senderType: SupportSenderType
  content: string
  createdAt: string
}

export interface Notification {
  id: string
  businessId: string
  category: NotificationCategory
  title: string
  message: string
  data: Json | null
  readAt: string | null
  createdAt: string
}

export interface BillingTransaction {
  id: string
  businessId: string
  appointmentId: string | null
  clientId: string | null
  amount: number
  currency: string
  chainId: number
  txHash: string
  status: BillingTransactionStatus
  paymentType: BillingPaymentType
  metadata: Json | null
  createdAt: string
  updatedAt: string
}

export interface DashboardAnalytics {
  appointmentsToday: number
  upcomingAppointments: number
  totalClients: number
  cancelledAppointments: number
  completedAppointments: number
  noShowAppointments: number
  unreadNotifications: number
  activeAgents: number
  activeServices: number
  totalConversations: number
  bookedConversations: number
  callbacksRequested: number
}

export interface PortalContext {
  business: Business
  client: Client | null
}

export interface WidgetConfig extends Widget {
  businessName: string
  businessSlug: string
  agentName: string | null
  agentVoice: string | null
  agentLanguage: string | null
}

export interface AvailableSlot {
  date: string
  startAt: string
  endAt: string
  label: string
  dayOfWeek: number
}

export interface PublicBusinessProfile {
  id: string
  name: string
  slug: string
  specialty: string | null
  description: string | null
  logoUrl: string | null
  phone: string | null
  bookingEmail: string | null
  timezone: string
  address: string | null
  website: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  paymentWalletAddress: string | null
  paymentChainId: number | null
  paymentCurrency: string
}

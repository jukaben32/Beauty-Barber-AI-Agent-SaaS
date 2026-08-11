import { z } from 'zod'

export const idSchema = z.string().uuid()
export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens')

export const businessSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema.optional(),
  specialty: z.string().max(120).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  timezone: z.string().min(1).optional().nullable(),
})

export const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isActive: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  slotMinutes: z.number().int().min(5).max(240).optional(),
})

export const clinicServiceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  priceType: z.enum(['fixed', 'starting_at', 'contact']).optional(),
  price: z.number().positive().optional().nullable(),
  priceMin: z.number().positive().optional().nullable(),
  priceMax: z.number().positive().optional().nullable(),
  currency: z.string().min(3).max(10).optional(),
  active: z.boolean().optional(),
  color: z.string().max(40).optional().nullable(),
  instructions: z.string().max(4000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

export const agentSchema = z.object({
  name: z.string().min(2).max(120),
  title: z.string().max(120).optional().nullable(),
  specialty: z.string().max(120).optional().nullable(),
  voice: z.string().max(80).optional(),
  personality: z.string().max(120).optional(),
  sensitivity: z.number().min(0).max(1).optional(),
  greetingMessage: z.string().max(4000).optional(),
  systemPrompt: z.string().max(20000).optional(),
  status: z.enum(['draft', 'live', 'paused']).optional(),
  language: z.string().max(16).optional(),
})

export const clientSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  source: z.enum(['ai_call', 'widget_chat', 'manual', 'portal', 'website_form', 'whatsapp']).optional(),
  authUserId: z.string().uuid().optional().nullable(),
})

export const appointmentCreateSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  agentId: z.string().uuid().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  conversationId: z.string().uuid().optional().nullable(),
  scheduledAt: z.string().datetime(),
  source: z.enum(['widget', 'portal', 'manual', 'ai_call', 'phone', 'whatsapp']).optional(),
  status: z.enum(['scheduled', 'pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(5000).optional().nullable(),
  requestedScheduledAt: z.string().datetime().optional().nullable(),
  paymentStatus: z.enum(['not_required', 'pending', 'partial', 'paid', 'cash', 'refunded']).optional(),
})

export const appointmentStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(['scheduled', 'pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show']),
  cancellationReason: z.string().max(2000).optional().nullable(),
  cancelledBy: z.enum(['client', 'business', 'system']).optional(),
})

export const appointmentRescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
})

export const appointmentPaymentSchema = z.object({
  appointmentId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(10).optional(),
  chainId: z.number().int().positive().optional(),
  txHash: z.string().min(4).optional(),
  status: z.enum(['pending', 'confirmed', 'failed', 'refunded']).optional(),
  paymentType: z.enum(['booking_deposit', 'full_payment', 'subscription', 'portal_topup']).optional(),
  appointmentPaymentStatus: z.enum(['not_required', 'pending', 'partial', 'paid', 'cash', 'refunded']).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
})

export const portalCheckEmailSchema = z.object({
  email: z.string().email(),
  businessSlug: z.string().optional(),
  next: z.string().optional(),
  // Present only on the registration form - when set, the client record is
  // created/updated with these details before the magic link is sent.
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
})

export const portalCancelAppointmentSchema = z.object({
  reason: z.string().max(2000).optional().nullable(),
})

export const portalRescheduleAppointmentSchema = z.object({
  scheduledAt: z.string().datetime(),
})

export const portalRecordPaymentSchema = z.object({
  appointmentId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  amount: z.number().positive(),
  // 'CASH' is a special case handled separately in the route: no on-chain
  // verification, no chainId/txHash required - it just flags that the
  // client committed to paying at the clinic.
  currency: z.string().min(3).max(10),
  chainId: z.number().int().positive().optional(),
  txHash: z.string().min(4).optional(),
  status: z.enum(['pending', 'confirmed', 'failed', 'refunded']).optional(),
  paymentType: z.enum(['booking_deposit', 'full_payment', 'subscription', 'portal_topup']).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
})

export const widgetSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: slugSchema.optional(),
  agentId: z.string().uuid().optional().nullable(),
  enabled: z.boolean().optional(),
  position: z.string().max(40).optional(),
  theme: z.string().max(40).optional(),
  primaryColor: z.string().max(40).optional(),
  secondaryColor: z.string().max(40).optional(),
  tone: z.string().max(120).optional(),
  greetingMessage: z.string().max(4000).optional(),
  allowedOrigins: z.array(z.string().url()).optional(),
  slotDuration: z.number().int().min(5).max(240).optional(),
  showBranding: z.boolean().optional(),
})

export const websiteSchema = z.object({
  slug: slugSchema.optional(),
  agentId: z.string().uuid().optional().nullable(),
  template: z.enum(['serenity', 'pulse', 'clarity']).optional(),
  published: z.boolean().optional(),
  primaryColor: z.string().max(40).optional(),
  secondaryColor: z.string().max(40).optional(),
  font: z.string().max(80).optional(),
  logoUrl: z.string().url().optional().nullable(),
  siteTitle: z.string().min(2).max(120),
  siteDescription: z.string().min(2).max(4000),
  heroHeadline: z.string().max(240).optional().nullable(),
  heroSubheadline: z.string().max(500).optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  ctaPrimaryText: z.string().max(60).optional(),
  ctaSecondaryText: z.string().max(60).optional(),
  aboutTitle: z.string().max(120).optional(),
  aboutStory: z.string().max(5000).optional().nullable(),
  aboutPhotoUrl: z.string().url().optional().nullable(),
  footerTagline: z.string().max(120).optional().nullable(),
  footerCopyright: z.string().max(120).optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactAddress: z.string().max(240).optional().nullable(),
  contactHours: z.string().max(240).optional().nullable(),
  contactMapsUrl: z.string().url().optional().nullable(),
  yearsExperience: z.number().int().min(0).optional().nullable(),
  clientsServed: z.number().int().min(0).optional().nullable(),
  satisfactionPct: z.number().min(0).max(100).optional().nullable(),
  trustBadges: z.array(z.string()).optional(),
  featuredServiceIds: z.array(z.string().uuid()).optional(),
  socialYoutube: z.string().url().optional().nullable(),
  socialFacebook: z.string().url().optional().nullable(),
  socialInstagram: z.string().url().optional().nullable(),
  socialTiktok: z.string().url().optional().nullable(),
  socialLinkedin: z.string().url().optional().nullable(),
  socialPinterest: z.string().url().optional().nullable(),
})

export const websiteServiceSchema = z.object({
  id: z.string().uuid().optional(),
  icon: z.string().default('home'),
  name: z.string().default(''),
  description: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
})

export const websiteTeamMemberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().default(''),
  role: z.string().default(''),
  bio: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
})

export const websiteTestimonialSchema = z.object({
  id: z.string().uuid().optional(),
  quote: z.string().default(''),
  authorName: z.string().default(''),
  authorRole: z.string().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  sortOrder: z.coerce.number().int().default(0),
})

export const websiteSpecialtySchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().default(''),
  sortOrder: z.coerce.number().int().default(0),
})

export const websiteFaqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().default(''),
  answer: z.string().default(''),
  sortOrder: z.coerce.number().int().default(0),
})

export const saveWebsiteContentSchema = z.object({
  website: websiteSchema,
  services: z.array(websiteServiceSchema).default([]),
  teamMembers: z.array(websiteTeamMemberSchema).default([]),
  testimonials: z.array(websiteTestimonialSchema).default([]),
  specialties: z.array(websiteSpecialtySchema).default([]),
  faqs: z.array(websiteFaqSchema).default([]),
})

export const websiteSiteUrlSchema = z.object({
  slug: z
    .string()
    .min(3, 'Use at least 3 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
})

// senderType is deliberately not accepted from the client here - the
// portal message route always forces it to 'client' server-side, so a
// signed-in client can't post a message that renders as if it came from
// staff or the system.
export const portalSupportTicketSchema = z.object({
  appointmentId: z.string().uuid().optional().nullable(),
  subject: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
})

export const portalSupportMessageSchema = z.object({
  content: z.string().min(1).max(10000),
})

export const supportTicketSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  subject: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
})

export const supportMessageSchema = z.object({
  ticketId: z.string().uuid(),
  senderType: z.enum(['client', 'staff', 'system']),
  content: z.string().min(1).max(10000),
})

export const knowledgeDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(120),
  question: z.string().max(1000).optional().nullable(),
  answer: z.string().max(10000).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  catalogKey: z.string().max(120).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
})

export const businessSettingsSchema = z.object({
  timeZone: z.string().min(1).optional(),
  paymentWalletAddress: z.string().min(4).optional().nullable(),
  paymentChainId: z.number().int().positive().optional(),
  paymentCurrency: z.string().min(3).max(10).optional(),
  bookingDepositAmount: z.number().positive().optional().nullable(),
})

export const stripeAccountSchema = z.object({
  publishableKey: z.string().regex(/^pk_(live|test)_/, 'Must start with pk_live_ or pk_test_'),
  secretKey: z.string().regex(/^sk_(live|test)_/, 'Must start with sk_live_ or sk_test_'),
})

export const realtimeSessionSchema = z.object({
  businessSlug: z.string().min(2),
  widgetSlug: slugSchema.optional(),
  mode: z.enum(['voice', 'chat']).optional(),
  language: z.string().max(16).optional(),
  voice: z.string().max(40).optional(),
})

export const realtimeToolRequestSchema = z.object({
  toolName: z.string().min(1),
  arguments: z.record(z.unknown()).optional().default({}),
})

export const realtimeConversationStartSchema = z.object({
  businessSlug: z.string().min(2),
  widgetSlug: slugSchema.optional(),
  agentId: z.string().uuid().optional(),
})

export const realtimeConversationMessageSchema = z.object({
  businessSlug: z.string().min(2),
  role: z.enum(['agent', 'caller', 'system']),
  content: z.string().min(1).max(8000),
})

export const realtimeConversationEndSchema = z.object({
  businessSlug: z.string().min(2),
  durationSeconds: z.number().int().min(0).optional(),
  clientId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
})

export const websiteSubscriberSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  message: z.string().max(4000).optional().nullable(),
  source: z.string().max(80).optional(),
})

export type BusinessInput = z.infer<typeof businessSchema>
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>
export type StripeAccountInput = z.infer<typeof stripeAccountSchema>
export type AvailabilityInput = z.infer<typeof availabilitySchema>
export type ClinicServiceInput = z.infer<typeof clinicServiceSchema>
export type AgentInput = z.infer<typeof agentSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>
export type AppointmentStatusInput = z.infer<typeof appointmentStatusSchema>
export type AppointmentRescheduleInput = z.infer<typeof appointmentRescheduleSchema>
export type AppointmentPaymentInput = z.infer<typeof appointmentPaymentSchema>
export type PortalCheckEmailInput = z.infer<typeof portalCheckEmailSchema>
export type PortalRecordPaymentInput = z.infer<typeof portalRecordPaymentSchema>
export type WidgetInput = z.infer<typeof widgetSchema>
export type WebsiteInput = z.infer<typeof websiteSchema>
export type WebsiteServiceInput = z.infer<typeof websiteServiceSchema>
export type WebsiteTeamMemberInput = z.infer<typeof websiteTeamMemberSchema>
export type WebsiteTestimonialInput = z.infer<typeof websiteTestimonialSchema>
export type WebsiteSpecialtyInput = z.infer<typeof websiteSpecialtySchema>
export type WebsiteFaqInput = z.infer<typeof websiteFaqSchema>
export type SaveWebsiteContentInput = z.infer<typeof saveWebsiteContentSchema>
export type WebsiteSiteUrlInput = z.infer<typeof websiteSiteUrlSchema>
export type SupportTicketInput = z.infer<typeof supportTicketSchema>
export type SupportMessageInput = z.infer<typeof supportMessageSchema>
export type KnowledgeDocumentInput = z.infer<typeof knowledgeDocumentSchema>
export type RealtimeSessionInput = z.infer<typeof realtimeSessionSchema>
export type RealtimeToolRequestInput = z.infer<typeof realtimeToolRequestSchema>
export type WebsiteSubscriberInput = z.infer<typeof websiteSubscriberSchema>

import type { AppointmentSource, AppointmentWithRelations, Business, Service, KnowledgeDocument, Client } from '@/types'
import { DEFAULT_TIME_ZONE } from '@/constants'
import { buildAppointmentConfirmationEmail } from '@/lib/email/appointmentConfirmation'
import { buildAppointmentStatusEmail } from '@/lib/email/appointmentStatus'
import { buildBusinessAppointmentEmail } from '@/lib/email/businessNotification'
import { sendEmail } from '@/lib/resend'
import { createAppointment, cancelAppointment, confirmAppointment, getAppointmentById, getAvailableSlots, recordAppointmentPayment, rescheduleAppointment } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { createSupportTicket } from '@/services/support'
import { findOrCreateClient, getClientByEmail, searchClients } from '@/services/clients'
import { listActiveServices } from '@/services/services'
import { listKnowledgeDocuments, searchKnowledgeDocuments } from '@/services/faqs'
import { getBusinessById } from '@/services/business'
import type { DbClient } from '@/services/_shared'

export interface RealtimeToolDefinition {
  type: 'function'
  name: string
  description: string
  parameters: Record<string, unknown>
}

export const realtimeTools: RealtimeToolDefinition[] = [
  {
    type: 'function',
    name: 'list_services',
    description: 'List active services with durations and pricing.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_available_slots',
    description: 'Get available appointment slots for a service.',
    parameters: {
      type: 'object',
      properties: {
        serviceId: { type: 'string' },
        fromDate: { type: 'string' },
        daysAhead: { type: 'integer' },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'find_or_create_client',
    description: 'Find an existing client or create a new client record.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'create_appointment',
    description: 'Create an appointment after confirming service and time.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        clientName: { type: 'string' },
        clientEmail: { type: 'string' },
        clientPhone: { type: 'string' },
        serviceId: { type: 'string' },
        scheduledAt: { type: 'string' },
        notes: { type: 'string' },
        source: { type: 'string' },
      },
      required: ['serviceId', 'scheduledAt'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'confirm_appointment',
    description:
      'Mark an appointment as confirmed. Requires the phone number or email on file for that appointment to verify the caller.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        clientEmail: { type: 'string', description: 'Email on file for the appointment, used to verify the caller.' },
        clientPhone: { type: 'string', description: 'Phone number on file for the appointment, used to verify the caller.' },
      },
      required: ['appointmentId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'reschedule_appointment',
    description:
      'Reschedule an appointment to a new time. Requires the phone number or email on file for that appointment to verify the caller.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        scheduledAt: { type: 'string' },
        clientEmail: { type: 'string', description: 'Email on file for the appointment, used to verify the caller.' },
        clientPhone: { type: 'string', description: 'Phone number on file for the appointment, used to verify the caller.' },
      },
      required: ['appointmentId', 'scheduledAt'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'cancel_appointment',
    description:
      'Cancel an appointment and store the reason. Requires the phone number or email on file for that appointment to verify the caller.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        reason: { type: 'string' },
        clientEmail: { type: 'string', description: 'Email on file for the appointment, used to verify the caller.' },
        clientPhone: { type: 'string', description: 'Phone number on file for the appointment, used to verify the caller.' },
      },
      required: ['appointmentId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'search_faqs',
    description: 'Search the knowledge base for an answer.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'create_support_ticket',
    description: 'Open a support ticket for a client or staff follow-up.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        appointmentId: { type: 'string' },
        subject: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['subject'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'record_payment',
    description:
      'Record a billing transaction and link it to an appointment if needed. Requires the phone number or email on file for that appointment to verify the caller.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        clientId: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        chainId: { type: 'integer' },
        txHash: { type: 'string' },
        paymentType: { type: 'string' },
        clientEmail: { type: 'string', description: 'Email on file for the appointment, used to verify the caller.' },
        clientPhone: { type: 'string', description: 'Phone number on file for the appointment, used to verify the caller.' },
      },
      required: ['amount', 'currency', 'chainId', 'txHash'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'send_appointment_email',
    description: 'Send a booking confirmation or appointment status email to the client.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        type: { type: 'string', enum: ['confirmation', 'status_update'] },
        subject: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['appointmentId', 'type'],
      additionalProperties: false,
    },
  },
]

export function buildAssistantInstructions(opts: {
  business: Business
  services: Service[]
  faqs: KnowledgeDocument[]
  timezone?: string | null
}) {
  const serviceList = opts.services
    .map((service) => `- ${service.name} (${service.durationMinutes} min${service.price != null ? `, ${service.currency} ${service.price}` : ''})`)
    .join('\n')

  const faqList = opts.faqs
    .slice(0, 8)
    .map((faq) => `- ${faq.question || faq.title}: ${faq.answer || ''}`)
    .join('\n')

  return [
    `You are Clara, the AI booking receptionist for ${opts.business.name}, a salon/barbershop business.`,
    `Be warm, concise, and welcoming. Do not give hair, skin, or health advice beyond describing what a service includes — if a caller asks about an allergic reaction, a skin or scalp condition, or anything medical, tell them to consult a licensed dermatologist or physician and do not attempt to diagnose or treat it yourself.`,
    `Your job is to help clients book, reschedule, cancel, and understand our services.`,
    `Always ask for the minimum required client details and confirm date and time in the business timezone.`,
    `Before confirming, rescheduling, cancelling, or recording a payment on an EXISTING appointment, always ask the caller to state the phone number or email on file for that booking and pass it as clientEmail/clientPhone — this verifies you are speaking with the person who made the booking.`,
    `Business timezone: ${opts.timezone || opts.business.timezone || DEFAULT_TIME_ZONE}.`,
    `Services:\n${serviceList || '- No active services configured yet.'}`,
    `FAQs:\n${faqList || '- No FAQs configured yet.'}`,
    `If a caller describes a skin reaction, injury, or health concern that goes beyond a normal service, advise them to seek medical care and offer to note it for the stylist ahead of the appointment.`,
    `If a human handoff is needed, summarize the request clearly and mark the conversation as escalated.`,
  ].join('\n\n')
}

// GA Realtime session shape (POST /v1/realtime/client_secrets). OpenAI
// retired the old flat Beta shape (top-level voice/input_audio_format/
// turn_detection/modalities) on 2026-05-12 in favor of this nested
// `audio.input` / `audio.output` structure with a `type: 'realtime'`
// discriminator - see src/app/api/realtime/sdp/route.ts.
export function buildRealtimeSessionPayload(opts: {
  instructions: string
  voice?: string
  language?: string
}) {
  return {
    type: 'realtime' as const,
    model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
    instructions: opts.instructions,
    output_modalities: ['audio'],
    audio: {
      input: {
        // Format is an object, not a bare string - {"type":"audio/pcm","rate":24000}
        format: { type: 'audio/pcm', rate: 24000 },
        transcription: {
          model: 'whisper-1',
          // Without a language hint, Whisper defaults toward English and
          // produces garbled/half-translated text for other languages -
          // this is what was happening to Spanish call transcripts.
          language: opts.language,
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
      output: {
        format: { type: 'audio/pcm', rate: 24000 },
        voice: opts.voice || 'alloy',
      },
    },
    tools: realtimeTools,
  }
}

// This endpoint is reachable directly (any browser with a businessSlug can
// POST to /api/realtime/tools) and there's no server-tracked session tying a
// tool call to the caller who found this appointmentId. Without this check,
// anyone who learns an appointmentId (e.g. from a confirmation email) could
// cancel/reschedule/confirm/pay for someone else's appointment. We require
// the caller to state the email or phone on file, same as a salon or
// barbershop would verify identity over the phone before touching an
// existing booking.
function assertCallerMatchesClient(client: Client | null, args: Record<string, unknown>) {
  if (!client) {
    throw new Error('No client is linked to this appointment yet, so identity cannot be verified.')
  }

  const providedEmail = typeof args.clientEmail === 'string' ? args.clientEmail.trim().toLowerCase() : ''
  const providedPhone = typeof args.clientPhone === 'string' ? args.clientPhone.replace(/\D/g, '') : ''
  const onFileEmail = (client.email || '').trim().toLowerCase()
  const onFilePhone = (client.phone || '').replace(/\D/g, '')

  const emailMatches = Boolean(providedEmail) && Boolean(onFileEmail) && providedEmail === onFileEmail
  const phoneMatches = Boolean(providedPhone) && Boolean(onFilePhone) && providedPhone === onFilePhone

  if (!emailMatches && !phoneMatches) {
    throw new Error('Please confirm the phone number or email on file for this appointment before making changes.')
  }
}

async function sendAppointmentEmailForTool(supabase: DbClient, appointmentId: string, type: 'confirmation' | 'status_update', reason?: string | null) {
  const { data: appointmentRow, error: appointmentError } = await supabase
    .from('appointments')
    .select('*, clients(*), services(*), businesses(name, slug, booking_email)')
    .eq('id', appointmentId)
    .maybeSingle()
  if (appointmentError) throw appointmentError
  if (!appointmentRow) throw new Error('Appointment not found')

  const appointment: any = appointmentRow
  const clientEmail = appointment.clients?.email
  if (!clientEmail) throw new Error('Client email not found')

  const businessName = appointment.businesses?.name || 'Business'
  const serviceName = appointment.services?.name || 'Appointment'
  const scheduledAt = new Date(appointment.scheduled_at).toLocaleString('en-US')
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/portal`

  const html =
    type === 'confirmation'
      ? buildAppointmentConfirmationEmail({
          clientName: appointment.clients?.name || 'Client',
          businessName,
          serviceName,
          scheduledAt,
          portalUrl,
        })
      : buildAppointmentStatusEmail({
          clientName: appointment.clients?.name || 'Client',
          businessName,
          serviceName,
          scheduledAt,
          status: appointment.status,
          reason,
        })

  const subject =
    type === 'confirmation'
      ? `Appointment confirmed - ${businessName}`
      : `Appointment update - ${businessName}`

  return sendEmail({
    to: clientEmail,
    subject,
    html,
  })
}

// The AI voice agent books/cancels/reschedules appointments on the
// business's behalf same as a client would through the portal, but until
// now staff only found out by opening the dashboard. Mirrors the
// client/reschedule/cancel routes: email the business's booking address and
// drop a dashboard notification so voice-driven changes show up the same
// way portal-driven ones do.
async function notifyBusinessOfAppointmentEvent(
  supabase: DbClient,
  businessId: string,
  appointment: AppointmentWithRelations,
  event: 'booked' | 'cancelled' | 'reschedule_requested',
  reason?: string | null
) {
  const business = await getBusinessById(supabase, businessId)
  const client = appointment.client
  if (!business || !client) return

  const serviceName = appointment.service?.name || 'Appointment'
  const scheduledAtLabel = new Date(appointment.scheduledAt).toLocaleString('en-US')

  await Promise.all([
    business.bookingEmail
      ? sendEmail({
          to: business.bookingEmail,
          subject: `${event === 'booked' ? 'New appointment' : event === 'cancelled' ? 'Appointment cancelled' : 'Reschedule requested'} - ${client.name}`,
          html: buildBusinessAppointmentEmail({
            businessName: business.name,
            clientName: client.name,
            clientPhone: client.phone,
            clientEmail: client.email,
            serviceName,
            scheduledAt: scheduledAtLabel,
            event,
            reason: reason ?? null,
          }),
        })
      : Promise.resolve(),
    createNotification(supabase, businessId, {
      category: 'appointment',
      title:
        event === 'booked'
          ? 'Appointment booked by AI agent'
          : event === 'cancelled'
            ? 'Appointment cancelled by AI agent'
            : 'Reschedule requested by AI agent',
      message: `${client.name}'s ${serviceName} appointment was ${event === 'booked' ? 'booked' : event === 'cancelled' ? 'cancelled' : 'moved to ' + scheduledAtLabel} via the voice assistant.`,
      data: { appointmentId: appointment.id },
    }),
  ])
}

export async function executeRealtimeToolCall(
  supabase: DbClient,
  businessId: string,
  toolName: string,
  args: Record<string, unknown> = {},
  opts: { clientSource?: Client['source']; appointmentSource?: AppointmentSource } = {}
) {
  switch (toolName) {
    case 'list_services': {
      return { services: await listActiveServices(supabase, businessId) }
    }
    case 'get_available_slots': {
      return {
        slots: await getAvailableSlots(supabase, businessId, {
          serviceId: typeof args.serviceId === 'string' ? args.serviceId : null,
          fromDate: typeof args.fromDate === 'string' ? new Date(args.fromDate) : undefined,
          daysAhead: typeof args.daysAhead === 'number' ? args.daysAhead : undefined,
        }),
      }
    }
    case 'find_or_create_client': {
      const client = await findOrCreateClient(supabase, businessId, {
        name: String(args.name || 'Unknown'),
        email: typeof args.email === 'string' ? args.email : null,
        phone: typeof args.phone === 'string' ? args.phone : null,
        source: opts.clientSource ?? 'ai_call',
      })
      return { client }
    }
    case 'create_appointment': {
      const client =
        typeof args.clientId === 'string'
          ? null
          : await findOrCreateClient(supabase, businessId, {
              name: String(args.clientName || 'Unknown'),
              email: typeof args.clientEmail === 'string' ? args.clientEmail : null,
              phone: typeof args.clientPhone === 'string' ? args.clientPhone : null,
              source: opts.clientSource ?? 'ai_call',
            })

      const appointment = await createAppointment(supabase, businessId, {
        clientId: typeof args.clientId === 'string' ? args.clientId : client?.id ?? null,
        agentId: typeof args.agentId === 'string' ? args.agentId : null,
        serviceId: typeof args.serviceId === 'string' ? args.serviceId : null,
        scheduledAt: String(args.scheduledAt),
        source: (opts.appointmentSource ?? (typeof args.source === 'string' ? args.source : 'ai_call')) as AppointmentSource,
        notes: typeof args.notes === 'string' ? args.notes : null,
      })
      if ((client?.email || typeof args.clientEmail === 'string') && appointment.id) {
        await sendAppointmentEmailForTool(supabase, appointment.id, 'confirmation')
      }
      await notifyBusinessOfAppointmentEvent(supabase, businessId, appointment, 'booked')
      return { appointment, client }
    }
    case 'confirm_appointment': {
      const existing = await getAppointmentById(supabase, businessId, String(args.appointmentId))
      if (!existing) throw new Error('Appointment not found')
      assertCallerMatchesClient(existing.client ?? null, args)
      const appointment = await confirmAppointment(supabase, businessId, String(args.appointmentId))
      return { appointment }
    }
    case 'reschedule_appointment': {
      const existing = await getAppointmentById(supabase, businessId, String(args.appointmentId))
      if (!existing) throw new Error('Appointment not found')
      assertCallerMatchesClient(existing.client ?? null, args)
      const appointment = await rescheduleAppointment(supabase, businessId, String(args.appointmentId), String(args.scheduledAt))
      await notifyBusinessOfAppointmentEvent(supabase, businessId, appointment, 'reschedule_requested')
      return { appointment }
    }
    case 'cancel_appointment': {
      const existing = await getAppointmentById(supabase, businessId, String(args.appointmentId))
      if (!existing) throw new Error('Appointment not found')
      assertCallerMatchesClient(existing.client ?? null, args)
      const appointment = await cancelAppointment(supabase, businessId, String(args.appointmentId), typeof args.reason === 'string' ? args.reason : null)
      await sendAppointmentEmailForTool(supabase, appointment.id, 'status_update', typeof args.reason === 'string' ? args.reason : null)
      await notifyBusinessOfAppointmentEvent(supabase, businessId, appointment, 'cancelled', typeof args.reason === 'string' ? args.reason : null)
      return { appointment }
    }
    case 'search_faqs': {
      const query = String(args.query || '')
      return { faqs: await searchKnowledgeDocuments(supabase, businessId, query) }
    }
    case 'create_support_ticket': {
      const ticket = await createSupportTicket(supabase, businessId, {
        clientId: typeof args.clientId === 'string' ? args.clientId : null,
        appointmentId: typeof args.appointmentId === 'string' ? args.appointmentId : null,
        subject: String(args.subject || 'Support request'),
        description: typeof args.description === 'string' ? args.description : null,
      })
      return { ticket }
    }
    case 'record_payment': {
      const existing = await getAppointmentById(supabase, businessId, String(args.appointmentId || ''))
      if (!existing) throw new Error('Appointment not found')
      assertCallerMatchesClient(existing.client ?? null, args)
      return {
        payment: await recordAppointmentPayment(supabase, businessId, String(args.appointmentId || ''), {
          amount: Number(args.amount),
          currency: String(args.currency || 'USDC'),
          chainId: Number(args.chainId || 137),
          txHash: String(args.txHash || ''),
          paymentType: typeof args.paymentType === 'string' ? (args.paymentType as any) : 'booking_deposit',
        }),
      }
    }
    case 'send_appointment_email': {
      const type = args.type === 'status_update' ? 'status_update' : 'confirmation'
      return { sent: await sendAppointmentEmailForTool(supabase, String(args.appointmentId), type, typeof args.reason === 'string' ? args.reason : null) }
    }
    default:
      throw new Error(`Unsupported realtime tool: ${toolName}`)
  }
}

export async function buildRealtimeContext(supabase: DbClient, businessId: string) {
  const [business, services, faqs] = await Promise.all([
    getBusinessById(supabase, businessId),
    listActiveServices(supabase, businessId),
    listKnowledgeDocuments(supabase, businessId, true),
  ])

  if (!business) throw new Error('Business not found')

  return {
    business,
    services,
    faqs,
    instructions: buildAssistantInstructions({ business, services, faqs }),
  }
}

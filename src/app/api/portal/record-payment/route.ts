import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSupabaseAndUser } from '@/lib/route-helpers'
import { apiError, json, readJson } from '@/lib/api'
import { portalRecordPaymentSchema } from '@/validations'
import { getPublicBusinessProfile } from '@/services/business'
import { getAppointmentPublic } from '@/services/appointments'
import { getClientById } from '@/services/clients'
import { recordBillingTransaction } from '@/services/billing'
import { recordAppointmentPayment } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { DEFAULT_CHAIN_ID } from '@/constants'
import type { PublicBusinessProfile } from '@/types'

export async function POST(request: Request) {
  const { user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const url = new URL(request.url)
  const businessSlug = url.searchParams.get('businessSlug') || undefined
  const admin = createAdminClient()

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = portalRecordPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid payment payload', 422, { issues: parsed.error.flatten() })
  }

  let business: PublicBusinessProfile | null = businessSlug ? await getPublicBusinessProfile(admin, businessSlug) : null
  let appointment: Awaited<ReturnType<typeof getAppointmentPublic>> | null = null

  if (parsed.data.appointmentId) {
    appointment = await getAppointmentPublic(admin, parsed.data.appointmentId)
    if (!appointment) {
      return apiError('Appointment not found', 404)
    }
    if (appointment.client?.authUserId !== user.id) {
      return apiError('Forbidden', 403)
    }
    business = appointment.business ?? business
  } else if (parsed.data.clientId) {
    if (!business) {
      return apiError('Business not found', 404)
    }
    const client = await getClientById(admin, business.id, parsed.data.clientId)
    if (!client || client.authUserId !== user.id) {
      return apiError('Forbidden', 403)
    }
  } else {
    return apiError('appointmentId or clientId is required', 422)
  }

  if (!business) {
    return apiError('Business not found', 404)
  }

  const paymentType = parsed.data.paymentType || (parsed.data.appointmentId ? 'booking_deposit' : 'portal_topup')
  const isCash = parsed.data.currency.toUpperCase() === 'CASH'
  // Cash is never "confirmed" from the portal - nothing has actually been
  // paid yet, the client is just committing to pay at the business. Staff
  // marks it received later from the dashboard (the existing "Mark as Cash
  // Paid" action), same as a client calling in to say the same thing.
  const status = isCash ? 'pending' : parsed.data.status || 'confirmed'

  // The portal has no automated way to verify a payment actually happened
  // (no card processor, no on-chain check) — every method here (cash,
  // transfer, card) is a client self-report. A signed-in client could
  // otherwise claim "confirmed" for their OWN appointment (the auth check
  // above only stops them acting on someone ELSE's) and have it accepted
  // as paid without staff ever seeing the money. Staff confirm it from the
  // dashboard once the funds actually show up.
  if (status === 'confirmed') {
    return apiError('Payments reported from the client portal cannot be marked confirmed automatically. Staff must confirm it from the dashboard.', 422)
  }

  const payment = parsed.data.appointmentId
    ? await recordAppointmentPayment(admin, business.id, parsed.data.appointmentId, {
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        chainId: parsed.data.chainId,
        txHash: parsed.data.txHash,
        status,
        paymentType,
        paymentMethod: parsed.data.paymentMethod ?? (isCash ? 'cash' : undefined),
        paymentReference: parsed.data.paymentReference,
        appointmentPaymentStatus: isCash ? 'cash' : undefined,
        metadata: parsed.data.metadata ?? null,
      })
    : await recordBillingTransaction(admin, business.id, {
        appointmentId: null,
        clientId: parsed.data.clientId ?? null,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        chainId: parsed.data.chainId ?? DEFAULT_CHAIN_ID,
        txHash: parsed.data.txHash ?? `cash-${randomUUID()}`,
        status,
        paymentType,
        paymentMethod: parsed.data.paymentMethod ?? (isCash ? 'cash' : undefined),
        paymentReference: parsed.data.paymentReference,
        metadata: parsed.data.metadata ?? null,
      })

  await createNotification(admin, business.id, {
    category: 'billing',
    title: 'Payment recorded',
    message: `Payment recorded for ${parsed.data.appointmentId ? `appointment ${parsed.data.appointmentId}` : 'portal account'}.`,
    data: {
      appointmentId: parsed.data.appointmentId ?? null,
      clientId: parsed.data.clientId ?? null,
      txHash: parsed.data.txHash,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
    },
  })

  return json({
    business,
    appointment: appointment ?? null,
    payment,
  })
}

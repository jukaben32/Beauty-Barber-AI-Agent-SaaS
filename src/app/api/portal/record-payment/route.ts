import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSupabaseAndUser } from '@/lib/route-helpers'
import { apiError, json, readJson } from '@/lib/api'
import { portalRecordPaymentSchema } from '@/validations'
import { getPublicBusinessProfile } from '@/services/business'
import { getAppointmentPublic } from '@/services/appointments'
import { getPatientById } from '@/services/patients'
import { recordBillingTransaction } from '@/services/billing'
import { recordAppointmentPayment } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { verifyUsdcPayment } from '@/lib/onchain'
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
    if (appointment.patient?.authUserId !== user.id) {
      return apiError('Forbidden', 403)
    }
    business = appointment.business ?? business
  } else if (parsed.data.patientId) {
    if (!business) {
      return apiError('Business not found', 404)
    }
    const patient = await getPatientById(admin, business.id, parsed.data.patientId)
    if (!patient || patient.authUserId !== user.id) {
      return apiError('Forbidden', 403)
    }
  } else {
    return apiError('appointmentId or patientId is required', 422)
  }

  if (!business) {
    return apiError('Business not found', 404)
  }

  const paymentType = parsed.data.paymentType || (parsed.data.appointmentId ? 'booking_deposit' : 'portal_topup')
  const isCash = parsed.data.currency.toUpperCase() === 'CASH'
  // Cash is never "confirmed" from the portal - nothing has actually been
  // paid yet, the patient is just committing to pay at the clinic. Staff
  // marks it received later from the dashboard (the existing "Mark as Cash
  // Paid" action), same as a patient calling in to say the same thing.
  const status = isCash ? 'pending' : parsed.data.status || 'confirmed'

  // Only "confirmed" is a claim we need to check — 'pending'/'failed' don't
  // assert money moved. A signed-in patient could otherwise report a
  // fabricated txHash for their OWN appointment (the auth check above only
  // stops them acting on someone ELSE's) and have it accepted as paid.
  if (status === 'confirmed') {
    if (parsed.data.currency.toUpperCase() !== 'USDC') {
      return apiError(`Unsupported payment currency for verification: ${parsed.data.currency}`, 422)
    }
    if (!business.paymentWalletAddress) {
      return apiError('This business has not configured a payment wallet yet', 422)
    }
    if (!parsed.data.txHash || !parsed.data.chainId) {
      return apiError('txHash and chainId are required to verify a confirmed payment', 422)
    }
    const verification = await verifyUsdcPayment({
      txHash: parsed.data.txHash,
      chainId: parsed.data.chainId,
      expectedRecipient: business.paymentWalletAddress,
      expectedMinAmount: parsed.data.amount,
    })
    if (!verification.ok) {
      return apiError(`Payment could not be verified on-chain: ${verification.reason}`, 402)
    }
  }

  const payment = parsed.data.appointmentId
    ? await recordAppointmentPayment(admin, business.id, parsed.data.appointmentId, {
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        chainId: parsed.data.chainId,
        txHash: parsed.data.txHash,
        status,
        paymentType,
        appointmentPaymentStatus: isCash ? 'cash' : undefined,
        metadata: parsed.data.metadata ?? null,
      })
    : await recordBillingTransaction(admin, business.id, {
        appointmentId: null,
        patientId: parsed.data.patientId ?? null,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        chainId: parsed.data.chainId ?? DEFAULT_CHAIN_ID,
        txHash: parsed.data.txHash ?? `cash-${randomUUID()}`,
        status,
        paymentType,
        metadata: parsed.data.metadata ?? null,
      })

  await createNotification(admin, business.id, {
    category: 'billing',
    title: 'Payment recorded',
    message: `Payment recorded for ${parsed.data.appointmentId ? `appointment ${parsed.data.appointmentId}` : 'portal account'}.`,
    data: {
      appointmentId: parsed.data.appointmentId ?? null,
      patientId: parsed.data.patientId ?? null,
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

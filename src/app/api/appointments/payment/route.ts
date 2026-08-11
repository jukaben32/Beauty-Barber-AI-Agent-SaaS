import { randomUUID } from 'node:crypto'
import { apiError, json, readJson } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { recordAppointmentPayment } from '@/services/appointments'
import { createNotification } from '@/services/notifications'
import { appointmentPaymentSchema } from '@/validations'

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = appointmentPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid payment payload', 422, { issues: parsed.error.flatten() })
  }

  const txHash = parsed.data.txHash?.trim() || `clinic-${parsed.data.appointmentId}-${randomUUID()}`
  const appointment = await recordAppointmentPayment(supabase, business.id, parsed.data.appointmentId, {
    amount: parsed.data.amount,
    currency: parsed.data.currency || business.paymentCurrency,
    chainId: parsed.data.chainId || business.paymentChainId || 137,
    txHash,
    status: parsed.data.status,
    paymentType: parsed.data.paymentType,
    appointmentPaymentStatus: parsed.data.appointmentPaymentStatus,
    metadata: parsed.data.metadata ?? null,
  })

  await createNotification(supabase, business.id, {
    category: 'billing',
    title: 'Payment recorded',
    message: `Payment recorded for appointment ${appointment.id}.`,
    data: { appointmentId: appointment.id, amount: parsed.data.amount, txHash },
  })

  return json({ appointment })
}

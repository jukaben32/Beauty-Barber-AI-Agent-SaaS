import { apiError, json } from '@/lib/api'
import { getBusinessForCurrentUser, getServerSupabaseAndUser } from '@/lib/route-helpers'
import { getAppointmentById } from '@/services/appointments'
import { listBillingTransactionsForAppointment } from '@/services/billing'

export async function GET(
  _request: Request,
  { params }: { params: { appointmentId: string } }
) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const appointment = await getAppointmentById(supabase, business.id, params.appointmentId)
  if (!appointment) {
    return apiError('Appointment not found', 404)
  }

  const transactions = await listBillingTransactionsForAppointment(supabase, business.id, params.appointmentId)
  const dueAmount = appointment.paymentAmount ?? appointment.service?.price ?? business.bookingDepositAmount ?? null
  const confirmedTotal = transactions
    .filter((transaction) => transaction.status === 'confirmed')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  const refundedTotal = transactions
    .filter((transaction) => transaction.status === 'refunded')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  const paidTotal = Math.max(confirmedTotal - refundedTotal, 0)

  return json({
    transactions,
    summary: {
      due: dueAmount != null ? Number(dueAmount) : null,
      paid: paidTotal,
      remaining: dueAmount != null ? Math.max(Number(dueAmount) - paidTotal, 0) : null,
      currency: appointment.paymentCurrency ?? business.paymentCurrency,
    },
  })
}


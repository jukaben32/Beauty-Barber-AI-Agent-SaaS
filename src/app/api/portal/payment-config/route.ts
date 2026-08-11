import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json } from '@/lib/api'
import { getPublicBusinessProfile } from '@/services/business'
import { getAppointmentPublic } from '@/services/appointments'
import { getPaymentConfigForBusiness } from '@/services/billing'
import type { PublicBusinessProfile } from '@/types'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const businessSlug = url.searchParams.get('businessSlug')
  const appointmentId = url.searchParams.get('appointmentId')
  const admin = createAdminClient()

  let business: PublicBusinessProfile | null = null

  if (businessSlug) {
    business = await getPublicBusinessProfile(admin, businessSlug)
  } else if (appointmentId) {
    const appointment = await getAppointmentPublic(admin, appointmentId)
    business = appointment?.business ?? null
  }

  if (!business) {
    return apiError('Business not found', 404)
  }

  const paymentConfig = await getPaymentConfigForBusiness(admin, business.id)
  return json({
    business,
    paymentConfig,
  })
}

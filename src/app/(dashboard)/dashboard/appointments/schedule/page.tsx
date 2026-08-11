import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { getDateKeyInTimeZone } from '@/services/_shared'
import { ScheduleManager } from '@/components/dashboard/ScheduleManager'

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const allAppointments = await listAppointmentsForBusiness(supabase, business.id, { limit: 500 })
  const todayKey = getDateKeyInTimeZone(new Date(), business.timezone)
  const appointmentDateKeys = Array.from(
    new Set(allAppointments.map((appointment) => getDateKeyInTimeZone(new Date(appointment.scheduledAt), business.timezone)))
  ).sort()
  const initialSelectedDateKey =
    appointmentDateKeys.find((dateKey) => dateKey >= todayKey) ??
    appointmentDateKeys[appointmentDateKeys.length - 1] ??
    todayKey

  return (
    <ScheduleManager
      initialAppointments={allAppointments}
      timezone={business.timezone}
      businessName={business.name}
      initialSelectedDateKey={initialSelectedDateKey}
      todayKey={todayKey}
    />
  )
}

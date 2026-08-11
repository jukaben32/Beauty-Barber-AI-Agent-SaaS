import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listNotificationsForBusiness, getUnreadNotificationCount } from '@/services/notifications'
import { NotificationsManager } from '@/components/dashboard/NotificationsManager'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForBusiness(supabase, business.id, 50),
    getUnreadNotificationCount(supabase, business.id),
  ])

  return <NotificationsManager initialNotifications={notifications} initialUnreadCount={unreadCount} businessId={business.id} />
}

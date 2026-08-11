import type { Notification, NotificationCategory } from '@/types'
import type { DbClient } from './_shared'

function toNotification(row: any): Notification {
  return {
    id: row.id,
    businessId: row.business_id,
    category: row.category,
    title: row.title,
    message: row.message,
    data: row.data ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  }
}

export async function listNotificationsForBusiness(supabase: DbClient, businessId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(toNotification)
}

export async function getUnreadNotificationCount(supabase: DbClient, businessId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .is('read_at', null)
  if (error) throw error
  return count ?? 0
}

export async function createNotification(
  supabase: DbClient,
  businessId: string,
  input: {
    category?: NotificationCategory
    title: string
    message: string
    data?: Record<string, unknown> | null
  }
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      business_id: businessId,
      category: input.category ?? 'system',
      title: input.title,
      message: input.message,
      data: input.data ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return toNotification(data)
}

export async function markNotificationRead(supabase: DbClient, businessId: string, notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('id', notificationId)
    .select('*')
    .single()
  if (error) throw error
  return toNotification(data)
}

export async function markAllNotificationsRead(supabase: DbClient, businessId: string) {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('business_id', businessId).is('read_at', null)
  if (error) throw error
}

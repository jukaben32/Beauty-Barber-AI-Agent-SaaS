'use client'

import { useState } from 'react'
import type { Notification, NotificationCategory } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { markNotificationRead, markAllNotificationsRead } from '@/services/notifications'
import { SectionEyebrow, SectionHeading, SurfaceCard, StatusBadge } from '@/components/clinic/shared'

const CATEGORY_TONE: Record<NotificationCategory, 'teal' | 'emerald' | 'blue' | 'rose' | 'slate'> = {
  appointment: 'teal',
  billing: 'emerald',
  widget: 'blue',
  support: 'rose',
  system: 'slate',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function NotificationsManager({
  initialNotifications,
  initialUnreadCount,
  businessId,
}: {
  initialNotifications: Notification[]
  initialUnreadCount: number
  businessId: string
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  async function handleMarkRead(notification: Notification) {
    if (notification.readAt) return
    const supabase = createClient()
    const updated = await markNotificationRead(supabase, businessId, notification.id)
    setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function handleMarkAllRead() {
    const supabase = createClient()
    await markAllNotificationsRead(supabase, businessId)
    setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })))
    setUnreadCount(0)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<SectionEyebrow>Notifications</SectionEyebrow>}
        title="Everything the team should know, in one feed"
        description="Booking updates, payment confirmations, support alerts, and system notices arrive in one place."
        actions={
          unreadCount > 0 ? (
            <button type="button" onClick={() => void handleMarkAllRead()} className="btn-secondary !px-4 !py-2 !text-xs">
              Mark all read
            </button>
          ) : undefined
        }
      />

      <SurfaceCard className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-[var(--text-strong)]">Activity feed</div>
          <StatusBadge tone={unreadCount > 0 ? 'teal' : 'slate'}>{unreadCount} unread</StatusBadge>
        </div>
        <div className="mt-5 space-y-3">
          {notifications.length === 0 && <p className="text-sm text-[var(--text-muted)]">No notifications yet.</p>}
          {notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void handleMarkRead(item)}
              className={`block w-full border px-4 py-3 text-left ${item.readAt ? 'border-[var(--border-soft)] bg-[var(--panel-soft)]' : 'border-[var(--brand)] bg-[var(--brand-soft)]'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[var(--text-strong)]">{item.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{item.message}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge tone={CATEGORY_TONE[item.category]}>{item.category}</StatusBadge>
                  <span className="text-[11px] text-[var(--text-muted)]">{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}

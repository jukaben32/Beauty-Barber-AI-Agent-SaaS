'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Bot,
  CalendarDays,
  CalendarRange,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Menu,
  Search,
  Settings2,
  Sparkles,
  Scissors,
  User,
  Users,
  LineChart,
  PhoneCall,
  X,
} from 'lucide-react'

import { BrandMark } from '@/components/dashboard/shared'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

type NavGroup = {
  label: string
  items: readonly NavItem[]
}

// The sidebar now mirrors the reference video more closely:
// OPERATIONS / SETUP / ACCOUNT, with the closest existing routes mapped in.
const navGroups: readonly NavGroup[] = [
  {
    label: 'OPERATIONS',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
      { href: '/dashboard/conversations', label: 'Call Log', icon: PhoneCall },
      { href: '/dashboard/appointments', label: 'Appointments', icon: CalendarDays },
      { href: '/dashboard/appointments/schedule', label: 'Schedule', icon: CalendarRange },
      { href: '/dashboard/clients', label: 'Clients', icon: Users },
      { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
    ],
  },
  {
    label: 'SETUP',
    items: [
      { href: '/dashboard/agents', label: 'AI Agents', icon: Bot },
      { href: '/dashboard/services', label: 'Services', icon: Scissors },
      { href: '/dashboard/faqs', label: 'Knowledge', icon: FileText },
      { href: '/dashboard/widget', label: 'Widget', icon: Sparkles },
      { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { href: '/dashboard/website', label: 'Website', icon: Globe2 },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { href: '/dashboard/billing', label: 'Plan', icon: CreditCard },
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings2 },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

// Longest matching href wins so a parent route (e.g. /dashboard/appointments)
// doesn't also light up when a more specific child route has its own nav entry.
function bestMatch(pathname: string, items: readonly NavItem[]) {
  return items
    .filter((item) => isActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

export function DashboardChrome({
  businessName,
  ownerEmail,
  children,
}: {
  businessName: string
  ownerEmail: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const allItems = navGroups.flatMap((group) => group.items)
  const activeItem = bestMatch(pathname, allItems) ?? navGroups[0].items[0]
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Below lg, the <aside> is hidden entirely (no sidebar rendered at all),
  // so without this drawer there was no way to navigate the dashboard on a
  // phone. Close it whenever the route actually changes underneath it.
  const [syncedPathname, setSyncedPathname] = useState(pathname)
  if (syncedPathname !== pathname) {
    setSyncedPathname(pathname)
    setMobileNavOpen(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function renderSidebarContent() {
    return (
      <div className="sticky top-0 flex min-h-full flex-col text-white" style={{ background: 'linear-gradient(180deg, #10222a 0%, #132b34 56%, #0f2129 100%)' }}>
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="rounded-[18px] border border-white/10 bg-white/6 p-3.5 backdrop-blur-sm flex-1">
              <BrandMark compact />
              <div className="mt-2 text-[11px] leading-5 text-white/60">
                AI voice platform for salons & barbershops
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 rounded-[18px] border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{businessName}</div>
                <div className="truncate text-[11px] text-white/60">{ownerEmail}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-3.5 py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-2 font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = item.href === activeItem.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn('sidebar-link', active ? 'sidebar-link-active' : 'text-white/68 hover:text-white')}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2.5 border-t border-white/10 p-3.5">
          <div className="plate-corners relative rounded-[24px] border border-white/10 bg-white/6 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse-slow rounded-full" style={{ background: 'var(--brand-soft)' }} />
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--brand-soft)' }}>
                AI active
              </span>
            </div>
            <p className="mt-2 text-xs leading-6 text-white/72">
              24/7 smart booking assistant active across widget, portal, and phone workflows.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-[13px] font-semibold text-white/72 transition hover:bg-white/6 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_12%_18%,rgba(19,122,114,0.12),transparent_22%),radial-gradient(circle_at_86%_10%,rgba(236,170,93,0.14),transparent_18%),var(--page-bg)] p-3 text-[var(--text-strong)] lg:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1760px] overflow-hidden rounded-[34px] border border-white/60 bg-[rgba(255,253,248,0.84)] shadow-[0_30px_100px_-60px_rgba(15,33,41,0.55)] backdrop-blur-xl lg:min-h-[calc(100vh-2rem)]">
        <aside className="hidden lg:flex lg:w-[272px] lg:flex-col">{renderSidebarContent()}</aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <div className="relative flex h-full w-[280px] max-w-[80vw] flex-col">{renderSidebarContent()}</div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-5 border-b border-[var(--border-soft)] bg-[rgba(255,253,248,0.78)] px-5 py-4 backdrop-blur-xl lg:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/80 text-[var(--text-strong)] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="mr-auto">
              <div className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Business workspace
              </div>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{activeItem.label}</h1>
            </div>

            <div className="hidden min-w-[260px] flex-1 items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/82 px-4 py-2.5 lg:flex lg:max-w-sm">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-sm text-[var(--text-muted)]">Search clients, appointments, or services...</span>
            </div>
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/82 text-[var(--text-strong)]"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
            </button>
            <div className="hidden items-center gap-2.5 rounded-full border border-[var(--border-soft)] bg-white/82 py-1.5 pl-1.5 pr-4 sm:flex">
              <div
                className="grid h-8 w-8 place-items-center rounded-full text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }}
              >
                {businessName.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="leading-tight">
                <div className="max-w-[160px] truncate text-xs font-semibold text-[var(--text-strong)]">{businessName}</div>
                <div className="max-w-[160px] truncate text-[11px] text-[var(--text-muted)]">{ownerEmail}</div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 pb-10 lg:px-6 lg:py-7">{children}</main>
        </div>
      </div>
    </div>
  )
}

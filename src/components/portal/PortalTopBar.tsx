'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { BrandMark } from '@/components/dashboard/shared'
import { createClient } from '@/lib/supabase/client'

export function PortalTopBar({ businessName }: { businessName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portal/login')
    router.refresh()
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-4 pt-6 lg:px-8">
      <div className="flex items-center gap-4">
        <BrandMark compact />
        <div className="text-sm font-semibold text-[var(--text-strong)]">{businessName}</div>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-bold text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)]"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}

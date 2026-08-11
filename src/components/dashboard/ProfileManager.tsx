'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SectionEyebrow, SurfaceCard } from '@/components/dashboard/shared'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
  assistant: 'Assistant',
}

export function ProfileManager({
  email,
  fullName,
  role,
  businessName,
}: {
  email: string
  fullName: string
  role: string
  businessName: string
}) {
  const [name, setName] = useState(fullName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
      if (updateError) throw updateError
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const initials = (name || email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <SectionEyebrow>Profile</SectionEyebrow>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-strong)]">My profile</h1>
      </div>

      <SurfaceCard className="p-7">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center text-lg font-bold text-white" style={{ background: 'var(--brand)' }}>
            {initials || '?'}
          </div>
          <div>
            <div className="font-display text-lg font-bold text-[var(--text-strong)]">{name || email}</div>
            <div className="text-sm text-[var(--text-muted)]">{ROLE_LABEL[role] ?? role} · {businessName}</div>
          </div>
        </div>

        {error && <p className="mt-5 text-sm font-medium text-[var(--coral)]">{error}</p>}
        {saved && <p className="mt-5 text-sm font-medium" style={{ color: 'var(--brand-strong)' }}>Profile saved.</p>}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Doe" className="input-field w-full" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-strong)]">Email</label>
              <input value={email} disabled className="input-field w-full opacity-60" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-strong)]">Role</label>
            <input value={ROLE_LABEL[role] ?? role} disabled className="input-field w-full opacity-60 sm:w-1/2" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </SurfaceCard>
    </div>
  )
}

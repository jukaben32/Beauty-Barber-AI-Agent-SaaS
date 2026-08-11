import { redirect } from 'next/navigation'
import { CalendarDays, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { getWhatsappConnection, toPublicWhatsappConnection } from '@/services/whatsapp'
import { listAgentsForBusiness } from '@/services/agents'
import { WhatsappManager } from '@/components/dashboard/WhatsappManager'
import { SectionEyebrow, SectionHeading, StatusBadge, SurfaceCard } from '@/components/dashboard/shared'

function statusTone(status: string | null | undefined) {
  if (status === 'connected') return 'emerald' as const
  if (status === 'connecting') return 'amber' as const
  return 'slate' as const
}

export default async function WhatsappPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const [connection, agents] = await Promise.all([
    getWhatsappConnection(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
  ])

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<SectionEyebrow>Setup</SectionEyebrow>}
        title="WhatsApp"
        description="Connect Evolution API so the same clinic assistant can answer WhatsApp, qualify clients and book appointments."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <WhatsappManager initialConnection={connection ? toPublicWhatsappConnection(connection) : null} agents={agents} />

        <SurfaceCard className="p-6 lg:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
                Implementation notes
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                How WhatsApp fits the clinic stack
              </h2>
            </div>
            <StatusBadge tone={statusTone(connection?.status)}>
              {connection?.status ?? 'disconnected'}
            </StatusBadge>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex gap-3 rounded-[22px] border border-[var(--border-soft)] bg-white/75 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text-strong)]">Same assistant, new channel</div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  WhatsApp uses the same clinic tools, FAQs and appointment logic as the voice flow.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-[22px] border border-[var(--border-soft)] bg-white/75 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text-strong)]">Evolution API stays on your VPS</div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  Vercel renders the dashboard, but the WhatsApp gateway must run on a self-hosted Evolution API
                  server.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-[22px] border border-[var(--border-soft)] bg-white/75 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text-strong)]">Bookings stay tracked</div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  Appointments created from WhatsApp are stored with source <code>whatsapp</code> so reporting stays
                  clean.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-[22px] border border-[var(--border-soft)] bg-white/75 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text-strong)]">One channel, same knowledge base</div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  The assistant can search services, FAQ entries, appointments and payments before responding.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--border-soft)] bg-[var(--panel-soft)] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Required environment
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-muted)]">
              <p>
                <code>EVOLUTION_API_URL</code> and <code>EVOLUTION_API_KEY</code> enable the WhatsApp gateway.
              </p>
              <p>
                <code>OPENAI_API_KEY</code> powers the text assistant that answers and books through WhatsApp.
              </p>
              <p>
                The webhook route is <code>/api/whatsapp/webhook/[businessId]</code> and should be reachable from your
                Evolution API server.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

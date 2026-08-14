'use client'

import { useState } from 'react'
import { Bot, CheckCircle2, CreditCard } from 'lucide-react'
import type { BillingTransaction, BusinessSubscription, PlanId } from '@/types'
import { PLAN_LIMITS } from '@/constants'
import { SectionEyebrow, SectionHeading, SurfaceCard, StatusBadge } from '@/components/dashboard/shared'

type BillingTransactionStatusLike = 'pending' | 'confirmed' | 'failed' | 'refunded'

const STATUS_TONE: Record<BillingTransactionStatusLike, 'emerald' | 'amber' | 'rose'> = {
  confirmed: 'emerald',
  pending: 'amber',
  failed: 'rose',
  refunded: 'rose',
}

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Payment due',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
}

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  booking_deposit: 'Booking deposit',
  full_payment: 'Full payment',
  subscription: 'Subscription',
  portal_topup: 'Portal top up',
}

function truncateHash(hash: string) {
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export function BillingManager({
  subscription,
  paymentConfig,
  transactions,
  summary,
  agentCount,
}: {
  subscription: BusinessSubscription | null
  paymentConfig: { payment_wallet_address: string | null; payment_chain_id: number; payment_currency: string; booking_deposit_amount: number | null } | null
  transactions: BillingTransaction[]
  summary: { total: number; confirmed: number; pending: number; count: number }
  agentCount: number
}) {
  const currentPlan: PlanId = subscription?.plan ?? 'free'
  const agentLimit = PLAN_LIMITS[currentPlan].agentLimit
  const atLimit = agentLimit !== 0 && agentCount >= agentLimit

  const [loadingPlan, setLoadingPlan] = useState<PlanId | 'portal' | null>(null)

  async function upgrade(plan: Exclude<PlanId, 'free'>) {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const body = await res.json()
      if (body.url) window.location.assign(body.url)
      else setLoadingPlan(null)
    } catch {
      setLoadingPlan(null)
    }
  }

  async function openPortal() {
    setLoadingPlan('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const body = await res.json()
      if (body.url) window.location.assign(body.url)
      else setLoadingPlan(null)
    } catch {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={<SectionEyebrow>Billing</SectionEyebrow>}
        title="USDC billing, deposits, and subscription plans"
        description="Track tx hashes, payment types, and appointment-linked transactions directly from the business dashboard."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SurfaceCard className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Confirmed revenue</div>
          <div className="mt-2 font-display text-2xl font-bold text-[var(--text-strong)]">${summary.confirmed.toFixed(2)}</div>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Pending transactions</div>
          <div className="mt-2 font-display text-2xl font-bold text-[var(--text-strong)]">{summary.pending}</div>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Total transactions</div>
          <div className="mt-2 font-display text-2xl font-bold text-[var(--text-strong)]">{summary.count}</div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <SurfaceCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Plan</div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">
                  {PLAN_LIMITS[currentPlan].name}
                </h2>
              </div>
            </div>
            <StatusBadge tone={subscription?.status === 'active' ? 'emerald' : 'amber'}>
              {SUBSCRIPTION_STATUS_LABEL[subscription?.status ?? 'active'] ?? subscription?.status}
            </StatusBadge>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Bot className="h-4 w-4" />
            {agentCount}/{agentLimit || '∞'} AI agents used
          </div>
          {atLimit && (
            <p className="mt-2 text-xs font-semibold text-[var(--coral)]">
              You&apos;ve reached your plan&apos;s agent limit — upgrade to activate more.
            </p>
          )}
          {subscription?.stripeCustomerId && (
            <button className="btn-secondary mt-4" onClick={openPortal} disabled={loadingPlan === 'portal'}>
              {loadingPlan === 'portal' ? 'Opening…' : 'Manage billing'}
            </button>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(Object.values(PLAN_LIMITS) as (typeof PLAN_LIMITS)[PlanId][]).map((plan) => (
              <SurfaceCard key={plan.id} className="p-5" glow={plan.id === currentPlan}>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-[var(--text-strong)]">{plan.name}</div>
                  {plan.id === currentPlan && <StatusBadge tone="teal">Current</StatusBadge>}
                </div>
                <div className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">
                  ${plan.priceUsd}
                  <span className="text-sm font-normal text-[var(--text-muted)]">/mo</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Bot className="h-3.5 w-3.5 shrink-0" />
                  {plan.agentLimit === 0 ? 'Unlimited' : plan.agentLimit} AI agents
                </div>
                {plan.id !== 'free' && plan.id !== currentPlan && (
                  <button
                    className="btn-primary mt-3 w-full"
                    onClick={() => upgrade(plan.id as Exclude<PlanId, 'free'>)}
                    disabled={loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                  </button>
                )}
                {plan.id === currentPlan && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-strong)]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Current plan
                  </p>
                )}
              </SurfaceCard>
            ))}
          </div>

          {paymentConfig && (
            <div className="mt-6 space-y-3 border border-[var(--border-soft)] bg-[var(--panel-soft)] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Payment wallet</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Address</span>
                <strong className="text-[var(--text-strong)]">{paymentConfig.payment_wallet_address ? truncateHash(paymentConfig.payment_wallet_address) : 'Not configured'}</strong>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Chain ID</span>
                <strong className="text-[var(--text-strong)]">{paymentConfig.payment_chain_id}</strong>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Currency</span>
                <strong className="text-[var(--text-strong)]">{paymentConfig.payment_currency}</strong>
              </div>
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Transactions</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">Recent billing activity</h2>
            </div>
            <StatusBadge tone="teal">Polygon</StatusBadge>
          </div>
          <div className="mt-6 space-y-3">
            {transactions.length === 0 && <p className="text-sm text-[var(--text-muted)]">No transactions recorded yet.</p>}
            {transactions.map((tx) => (
              <div key={tx.id} className="border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-[var(--text-strong)]">{PAYMENT_TYPE_LABEL[tx.paymentType] ?? tx.paymentType}</div>
                    <div className="text-xs text-[var(--text-muted)]">{truncateHash(tx.txHash)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[var(--text-strong)]">${tx.amount} {tx.currency}</div>
                    <StatusBadge tone={STATUS_TONE[tx.status] ?? 'amber'}>{tx.status}</StatusBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

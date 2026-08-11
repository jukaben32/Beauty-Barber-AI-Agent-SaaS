import type { BillingTransaction, BusinessSubscription, PlanId } from '@/types'
import { SectionEyebrow, SectionHeading, SurfaceCard, StatusBadge } from '@/components/dashboard/shared'

const PLAN_CATALOG: Record<PlanId, { name: string; price: number; body: string }> = {
  free: { name: 'Free', price: 0, body: 'Demo access and sandbox widgets for testing.' },
  starter: { name: 'Starter', price: 49, body: '50 appointments/month, widget, and basic calendar.' },
  pro: { name: 'Professional', price: 99, body: 'Unlimited appointments, analytics, and custom AI.' },
  enterprise: { name: 'Enterprise', price: 299, body: 'Multi-location, custom integrations, dedicated support.' },
}

type BillingTransactionStatusLike = 'pending' | 'confirmed' | 'failed' | 'refunded'

const STATUS_TONE: Record<BillingTransactionStatusLike, 'emerald' | 'amber' | 'rose'> = {
  confirmed: 'emerald',
  pending: 'amber',
  failed: 'rose',
  refunded: 'rose',
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
}: {
  subscription: BusinessSubscription | null
  paymentConfig: { payment_wallet_address: string | null; payment_chain_id: number; payment_currency: string; booking_deposit_amount: number | null } | null
  transactions: BillingTransaction[]
  summary: { total: number; confirmed: number; pending: number; count: number }
}) {
  const currentPlan = subscription?.plan ?? 'free'

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
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Plans</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">Current plan and pricing</h2>
            </div>
            <StatusBadge tone={subscription?.status === 'active' ? 'emerald' : 'amber'}>{subscription?.status ?? 'no plan'}</StatusBadge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(Object.entries(PLAN_CATALOG) as [PlanId, (typeof PLAN_CATALOG)[PlanId]][]).map(([id, plan]) => (
              <SurfaceCard key={id} className={id === currentPlan ? 'p-5' : 'p-5'} glow={id === currentPlan}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-[var(--text-strong)]">{plan.name}</div>
                      {id === currentPlan && <StatusBadge tone="teal">Current</StatusBadge>}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{plan.body}</div>
                  </div>
                  <div className="font-display text-2xl font-bold tracking-tight text-[var(--text-strong)]">
                    {plan.price === 0 ? '$0' : `$${plan.price}`}
                  </div>
                </div>
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

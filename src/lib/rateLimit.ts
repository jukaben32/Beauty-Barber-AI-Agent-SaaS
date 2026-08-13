import type { DbClient } from '@/services/_shared'

export interface RateLimitResult {
  allowed: boolean
  count: number
  limit: number
}

// Fixed-window limiter backed by the rate_limit_hits table (see
// supabase/schema.sql, section 19). Bucketing the key by window index means
// each window's row starts fresh automatically - no separate reset step.
export async function checkRateLimit(
  admin: DbClient,
  opts: { key: string; limit: number; windowSeconds: number }
): Promise<RateLimitResult> {
  const windowIndex = Math.floor(Date.now() / (opts.windowSeconds * 1000))
  const bucketKey = `${opts.key}:${windowIndex}`
  const expiresAt = new Date((windowIndex + 1) * opts.windowSeconds * 1000).toISOString()

  const { data, error } = await admin.rpc('increment_rate_limit', {
    p_bucket_key: bucketKey,
    p_expires_at: expiresAt,
  })
  if (error) throw error

  const count = data as number
  return { allowed: count <= opts.limit, count, limit: opts.limit }
}

// Best-effort client IP from the headers Vercel/most proxies set. Not
// spoof-proof (a caller can forge x-forwarded-for), but good enough to slow
// down casual abuse of a public endpoint - the goal here is cost control,
// not airtight identity.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

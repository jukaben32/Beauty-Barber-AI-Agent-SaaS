import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { websiteSubscriberSchema } from '@/validations'
import { getBusinessById, getPublicBusinessProfile } from '@/services/business'
import { getWebsiteBySlug, createWebsiteSubscriber } from '@/services/websites'
import { createNotification } from '@/services/notifications'
import { sendEmail } from '@/lib/resend'
import { emailShell, escapeHtml } from '@/lib/email/shared'

const subscribeSchema = websiteSubscriberSchema.extend({
  businessSlug: z.string().optional(),
  websiteSlug: z.string().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return apiError('Invalid JSON body', 400)
  }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid subscriber payload', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()

  const rateLimit = await checkRateLimit(admin, { key: `website-subscribe:${getClientIp(request)}`, limit: 10, windowSeconds: 300 })
  if (!rateLimit.allowed) {
    return apiError('Too many requests. Please try again in a few minutes.', 429)
  }

  // businessSlug resolves through the public-profile lookup (slug-keyed);
  // websiteSlug resolves through the website row to get a businessId, which
  // needs getBusinessById (id-keyed) - getPublicBusinessProfile only takes
  // a slug, so passing a businessId into it silently matched nothing and
  // 404'd every websiteSlug-based submission (the only path the new
  // contact-form lead capture uses).
  let businessId: string | null = null
  if (parsed.data.businessSlug) {
    const profile = await getPublicBusinessProfile(admin, parsed.data.businessSlug)
    businessId = profile?.id ?? null
  } else if (parsed.data.websiteSlug) {
    const website = await getWebsiteBySlug(admin, parsed.data.websiteSlug)
    businessId = website?.businessId ?? null
  }

  const business = businessId ? await getBusinessById(admin, businessId) : null
  if (!business) {
    return apiError('Business not found', 404)
  }

  const subscriber = await createWebsiteSubscriber(admin, business.id, {
    email: parsed.data.email,
    name: parsed.data.name ?? null,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message ?? null,
    source: parsed.data.source || 'website',
  })

  const isLead = subscriber.source === 'contact_form'

  await Promise.all([
    business.bookingEmail
      ? sendEmail({
          to: business.bookingEmail,
          subject: `${isLead ? 'New website lead' : 'New website subscriber'} - ${subscriber.name || subscriber.email}`,
          html: emailShell(
            isLead ? 'New website lead' : 'New website subscriber',
            `<p>Hello ${escapeHtml(business.name)} team,</p>
             <table style="width:100%;border-collapse:collapse;margin:20px 0;">
               ${subscriber.name ? `<tr><td style="padding:8px 0;color:#64748b;">Name</td><td style="padding:8px 0;"><strong>${escapeHtml(subscriber.name)}</strong></td></tr>` : ''}
               <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;"><strong>${escapeHtml(subscriber.email)}</strong></td></tr>
               ${subscriber.phone ? `<tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;"><strong>${escapeHtml(subscriber.phone)}</strong></td></tr>` : ''}
             </table>
             ${subscriber.message ? `<p>${escapeHtml(subscriber.message)}</p>` : ''}`
          ),
        })
      : Promise.resolve(),
    createNotification(admin, business.id, {
      category: 'system',
      title: isLead ? 'New website lead' : 'New website subscriber',
      message: `${subscriber.name || subscriber.email} submitted the website ${isLead ? 'contact form' : 'sign-up form'}.`,
      data: { subscriberId: subscriber.id, email: subscriber.email, phone: subscriber.phone },
    }),
  ])

  return json({ subscriber }, { status: 201 })
}

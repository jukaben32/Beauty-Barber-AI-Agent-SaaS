import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json } from '@/lib/api'
import { checkWebsiteSlugAvailability } from '@/services/websites'

const slugQuerySchema = z.object({
  slug: z.string().min(2),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = slugQuerySchema.safeParse({
    slug: url.searchParams.get('slug') || '',
  })

  if (!parsed.success) {
    return apiError('Invalid slug', 422, { issues: parsed.error.flatten() })
  }

  const admin = createAdminClient()
  const available = await checkWebsiteSlugAvailability(admin, parsed.data.slug)
  return json({
    slug: parsed.data.slug,
    available,
  })
}

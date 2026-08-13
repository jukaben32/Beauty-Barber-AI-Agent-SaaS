import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { WebsiteTemplateRenderer } from '@/components/website/WebsiteTemplateRenderer'
import { getPublishedWebsiteContentBySlug } from '@/services/websites'

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = createAdminClient()
  const content = await getPublishedWebsiteContentBySlug(supabase, params.slug)

  if (!content) notFound()

  return (
    <WebsiteTemplateRenderer
      businessName={content.website.siteTitle}
      businessPhone={content.website.contactPhone}
      content={content}
    />
  )
}

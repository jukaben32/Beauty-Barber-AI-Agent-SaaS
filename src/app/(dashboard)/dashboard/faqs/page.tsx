import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForUser } from '@/services/business'
import { listKnowledgeDocuments } from '@/services/faqs'
import { KnowledgeManager } from '@/components/clinic/KnowledgeManager'

export default async function FaqsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const business = await getBusinessForUser(supabase, user.id)
  if (!business) redirect('/signup')

  const documents = await listKnowledgeDocuments(supabase, business.id)

  return <KnowledgeManager initialDocuments={documents} businessId={business.id} />
}

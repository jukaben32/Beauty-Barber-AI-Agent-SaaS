import type { KnowledgeDocument } from '@/types'
import type { DbClient } from './_shared'

function toKnowledge(row: any): KnowledgeDocument {
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    question: row.question ?? null,
    answer: row.answer ?? null,
    category: row.category ?? null,
    catalogKey: row.catalog_key ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listKnowledgeDocuments(supabase: DbClient, businessId: string, activeOnly = false) {
  let query = supabase.from('knowledge_documents').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(toKnowledge)
}

export async function searchKnowledgeDocuments(supabase: DbClient, businessId: string, queryString: string) {
  const trimmed = queryString.trim()
  if (!trimmed) return listKnowledgeDocuments(supabase, businessId, true)

  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .or(`title.ilike.%${trimmed}%,question.ilike.%${trimmed}%,answer.ilike.%${trimmed}%,category.ilike.%${trimmed}%`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toKnowledge)
}

export async function getKnowledgeDocumentById(supabase: DbClient, businessId: string, documentId: string) {
  const { data, error } = await supabase.from('knowledge_documents').select('*').eq('business_id', businessId).eq('id', documentId).maybeSingle()
  if (error) throw error
  return data ? toKnowledge(data) : null
}

export async function upsertKnowledgeDocument(
  supabase: DbClient,
  businessId: string,
  input: {
    id?: string
    title: string
    question?: string | null
    answer?: string | null
    category?: string | null
    catalogKey?: string | null
    sourceUrl?: string | null
    isActive?: boolean
  }
) {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .upsert({
      id: input.id,
      business_id: businessId,
      title: input.title,
      question: input.question ?? null,
      answer: input.answer ?? null,
      category: input.category ?? null,
      catalog_key: input.catalogKey ?? null,
      source_url: input.sourceUrl ?? null,
      is_active: input.isActive ?? true,
    })
    .select('*')
    .single()
  if (error) throw error
  return toKnowledge(data)
}

export async function deleteKnowledgeDocument(supabase: DbClient, businessId: string, documentId: string) {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .update({ is_active: false })
    .eq('business_id', businessId)
    .eq('id', documentId)
    .select('*')
    .single()
  if (error) throw error
  return toKnowledge(data)
}

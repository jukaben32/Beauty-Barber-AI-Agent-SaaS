import type { Service } from '@/types'
import { DEFAULT_CURRENCY } from '@/constants'
import type { DbClient } from './_shared'

export function toService(row: any): Service {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description ?? null,
    durationMinutes: row.duration_minutes,
    priceType: row.price_type,
    price: row.price ?? null,
    priceMin: row.price_min ?? null,
    priceMax: row.price_max ?? null,
    currency: row.currency,
    active: row.active,
    color: row.color ?? null,
    instructions: row.instructions ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listServices(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toService)
}

export async function listActiveServices(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toService)
}

export async function getServiceById(supabase: DbClient, businessId: string, serviceId: string) {
  const { data, error } = await supabase.from('services').select('*').eq('business_id', businessId).eq('id', serviceId).maybeSingle()
  if (error) throw error
  return data ? toService(data) : null
}

export async function createService(
  supabase: DbClient,
  businessId: string,
  input: {
    name: string
    description?: string | null
    durationMinutes?: number
    priceType?: Service['priceType']
    price?: number | null
    priceMin?: number | null
    priceMax?: number | null
    currency?: string
    active?: boolean
    color?: string | null
    instructions?: string | null
    sortOrder?: number
  }
) {
  const { data, error } = await supabase
    .from('services')
    .insert({
      business_id: businessId,
      name: input.name,
      description: input.description ?? null,
      duration_minutes: input.durationMinutes ?? 30,
      price_type: input.priceType ?? 'fixed',
      price: input.price ?? null,
      price_min: input.priceMin ?? null,
      price_max: input.priceMax ?? null,
      currency: input.currency ?? DEFAULT_CURRENCY,
      active: input.active ?? true,
      color: input.color ?? null,
      instructions: input.instructions ?? null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single()
  if (error) throw error
  return toService(data)
}

export async function updateService(supabase: DbClient, businessId: string, serviceId: string, patch: Partial<Service>) {
  const { data, error } = await supabase
    .from('services')
    .update({
      name: patch.name,
      description: patch.description,
      duration_minutes: patch.durationMinutes,
      price_type: patch.priceType,
      price: patch.price,
      price_min: patch.priceMin,
      price_max: patch.priceMax,
      currency: patch.currency,
      active: patch.active,
      color: patch.color,
      instructions: patch.instructions,
    })
    .eq('business_id', businessId)
    .eq('id', serviceId)
    .select('*')
    .single()
  if (error) throw error
  return toService(data)
}

export async function setServiceActive(supabase: DbClient, businessId: string, serviceId: string, active: boolean) {
  return updateService(supabase, businessId, serviceId, { active })
}

export async function deleteService(supabase: DbClient, businessId: string, serviceId: string) {
  return setServiceActive(supabase, businessId, serviceId, false)
}

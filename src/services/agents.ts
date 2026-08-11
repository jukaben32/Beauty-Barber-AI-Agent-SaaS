import type { AiAgent } from '@/types'
import { DEFAULT_WELCOME_MESSAGE } from '@/constants'
import { safeJsonParse } from '@/lib/utils'
import type { DbClient } from './_shared'

const AGENT_PROMPT_PREFIX = '[[agent-meta]]'
const AGENT_PROMPT_SUFFIX = '[[/agent-meta]]'

type AgentPromptMetadata = {
  serviceIds: string[]
  templateKey: string | null
}

const DEFAULT_AGENT_PROMPT_METADATA: AgentPromptMetadata = {
  serviceIds: [],
  templateKey: null,
}

function normalizeMetadata(metadata: Partial<AgentPromptMetadata> | null | undefined): AgentPromptMetadata {
  const serviceIds = Array.isArray(metadata?.serviceIds)
    ? Array.from(new Set(metadata.serviceIds.filter((serviceId): serviceId is string => typeof serviceId === 'string' && serviceId.length > 0)))
    : []

  return {
    serviceIds,
    templateKey: typeof metadata?.templateKey === 'string' && metadata.templateKey.trim().length > 0 ? metadata.templateKey.trim() : null,
  }
}

export function splitAgentSystemPrompt(systemPrompt: string | null | undefined): {
  prompt: string
  metadata: AgentPromptMetadata
} {
  const rawPrompt = systemPrompt ?? ''
  if (!rawPrompt.startsWith(AGENT_PROMPT_PREFIX)) {
    return {
      prompt: rawPrompt.trim(),
      metadata: DEFAULT_AGENT_PROMPT_METADATA,
    }
  }

  const suffixIndex = rawPrompt.indexOf(AGENT_PROMPT_SUFFIX)
  if (suffixIndex < 0) {
    return {
      prompt: rawPrompt.trim(),
      metadata: DEFAULT_AGENT_PROMPT_METADATA,
    }
  }

  const encodedMetadata = rawPrompt.slice(AGENT_PROMPT_PREFIX.length, suffixIndex)
  const parsedMetadata = safeJsonParse<Partial<AgentPromptMetadata>>(encodedMetadata, {})

  return {
    prompt: rawPrompt.slice(suffixIndex + AGENT_PROMPT_SUFFIX.length).trimStart(),
    metadata: normalizeMetadata(parsedMetadata),
  }
}

export function buildAgentSystemPrompt(systemPrompt: string, metadata?: Partial<AgentPromptMetadata>) {
  const normalizedMetadata = normalizeMetadata(metadata)
  const encodedMetadata = JSON.stringify(normalizedMetadata)
  const basePrompt = systemPrompt.trim()
  const header = `${AGENT_PROMPT_PREFIX}${encodedMetadata}${AGENT_PROMPT_SUFFIX}`

  return basePrompt ? `${header}\n${basePrompt}` : header
}

function toAgent(row: any): AiAgent {
  const { prompt, metadata } = splitAgentSystemPrompt(row.system_prompt ?? '')

  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    title: row.title ?? null,
    specialty: row.specialty ?? null,
    voice: row.voice,
    personality: row.personality,
    sensitivity: Number(row.sensitivity ?? 0.5),
    greetingMessage: row.greeting_message ?? DEFAULT_WELCOME_MESSAGE,
    systemPrompt: prompt,
    assignedServiceIds: metadata.serviceIds,
    templateKey: metadata.templateKey,
    status: row.status,
    language: row.language ?? 'en',
    callsHandled: row.calls_handled ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listAgentsForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase.from('ai_agents').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toAgent)
}

export async function getAgentById(supabase: DbClient, businessId: string, agentId: string) {
  const { data, error } = await supabase.from('ai_agents').select('*').eq('business_id', businessId).eq('id', agentId).maybeSingle()
  if (error) throw error
  return data ? toAgent(data) : null
}

export async function getLiveAgentForBusiness(supabase: DbClient, businessId: string) {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'live')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? toAgent(data) : null
}

export async function createAgent(
  supabase: DbClient,
  businessId: string,
  input: Partial<AiAgent> & { name: string }
) {
  const systemPrompt = buildAgentSystemPrompt(input.systemPrompt ?? '', {
    serviceIds: input.assignedServiceIds ?? [],
    templateKey: input.templateKey ?? null,
  })

  const { data, error } = await supabase
    .from('ai_agents')
    .insert({
      business_id: businessId,
      name: input.name,
      title: input.title ?? null,
      specialty: input.specialty ?? null,
      voice: input.voice ?? 'alloy',
      personality: input.personality ?? 'friendly',
      sensitivity: input.sensitivity ?? 0.5,
      greeting_message: input.greetingMessage ?? DEFAULT_WELCOME_MESSAGE,
      system_prompt: systemPrompt,
      status: input.status ?? 'draft',
      language: input.language ?? 'en',
      calls_handled: input.callsHandled ?? 0,
    })
    .select('*')
    .single()
  if (error) throw error
  return toAgent(data)
}

export async function updateAgent(supabase: DbClient, businessId: string, agentId: string, patch: Partial<AiAgent>) {
  const { data: current, error: currentError } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', agentId)
    .maybeSingle()
  if (currentError) throw currentError
  if (!current) throw new Error('Agent not found')

  const currentAgent = toAgent(current)
  const nextSystemPrompt = buildAgentSystemPrompt(patch.systemPrompt ?? currentAgent.systemPrompt, {
    serviceIds: patch.assignedServiceIds ?? currentAgent.assignedServiceIds ?? [],
    templateKey: patch.templateKey ?? currentAgent.templateKey ?? null,
  })

  const { data, error } = await supabase
    .from('ai_agents')
    .update({
      name: patch.name ?? currentAgent.name,
      title: patch.title ?? currentAgent.title,
      specialty: patch.specialty ?? currentAgent.specialty,
      voice: patch.voice ?? currentAgent.voice,
      personality: patch.personality ?? currentAgent.personality,
      sensitivity: patch.sensitivity ?? currentAgent.sensitivity,
      greeting_message: patch.greetingMessage ?? currentAgent.greetingMessage,
      system_prompt: nextSystemPrompt,
      status: patch.status ?? currentAgent.status,
      language: patch.language ?? currentAgent.language,
      calls_handled: patch.callsHandled ?? currentAgent.callsHandled,
    })
    .eq('business_id', businessId)
    .eq('id', agentId)
    .select('*')
    .single()
  if (error) throw error
  return toAgent(data)
}

export async function setAgentStatus(supabase: DbClient, businessId: string, agentId: string, status: AiAgent['status']) {
  return updateAgent(supabase, businessId, agentId, { status })
}

export async function incrementAgentCallsHandled(supabase: DbClient, businessId: string, agentId: string, by = 1) {
  const { data: current, error: currentError } = await supabase
    .from('ai_agents')
    .select('calls_handled')
    .eq('business_id', businessId)
    .eq('id', agentId)
    .maybeSingle()
  if (currentError) throw currentError

  const next = Number((current as any)?.calls_handled ?? 0) + by
  return updateAgent(supabase, businessId, agentId, { callsHandled: next })
}

export async function deleteAgent(supabase: DbClient, businessId: string, agentId: string) {
  const { error } = await supabase.from('ai_agents').delete().eq('business_id', businessId).eq('id', agentId)
  if (error) throw error
}

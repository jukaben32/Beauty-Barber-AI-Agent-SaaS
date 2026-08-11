import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AiAgent, Business, Service, KnowledgeDocument } from '@/types'
import { buildAssistantInstructions, realtimeTools, executeRealtimeToolCall } from './tools'

type DB = SupabaseClient<Database>

const CHAT_MODEL = process.env.OPENAI_WHATSAPP_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
const MAX_TOOL_ROUNDS = 6

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>
  tool_call_id?: string
}

function toChatCompletionTools() {
  return realtimeTools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))
}

function buildWhatsappSystemPrompt(ctx: {
  business: Business
  agent: AiAgent
  services: Service[]
  faqs: KnowledgeDocument[]
}) {
  const agentPrompt = ctx.agent.systemPrompt?.trim() || `You are ${ctx.agent.name}, the WhatsApp booking assistant for ${ctx.business.name}.`
  const bookingPrompt = buildAssistantInstructions({
    business: ctx.business,
    services: ctx.services,
    faqs: ctx.faqs,
  })

  return [
    agentPrompt,
    bookingPrompt,
    'WhatsApp style rules: keep replies short, warm, and plain text. Avoid markdown tables and long blocks. Ask one question at a time when you need more details. Always use the available tools when you need services, availability, appointments, FAQ answers, or payments.',
  ].join('\n\n')
}

export async function runWhatsappAgentTurn(
  supabase: DB,
  ctx: {
    business: Business
    agent: AiAgent
    services: Service[]
    faqs: KnowledgeDocument[]
    businessId: string
    conversationId: string
    history: Array<{ role: 'user' | 'assistant'; content: string | null }>
  }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: buildWhatsappSystemPrompt(ctx) },
    ...ctx.history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature: 0.4,
        messages,
        tools: toChatCompletionTools(),
        tool_choice: 'auto',
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`OpenAI Chat Completions error: ${detail}`)
    }

    const data = await response.json()
    const message = data?.choices?.[0]?.message
    if (!message) {
      throw new Error('OpenAI Chat Completions returned no message')
    }

    if (!message.tool_calls?.length) {
      return (message.content ?? '').trim()
    }

    messages.push({
      role: 'assistant',
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    })

    for (const call of message.tool_calls) {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(call.function.arguments || '{}')
      } catch {
        args = {}
      }

      let result: unknown
      try {
        result = await executeRealtimeToolCall(
          supabase,
          ctx.businessId,
          call.function.name,
          args,
          { clientSource: 'whatsapp', appointmentSource: 'whatsapp' }
        )
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : 'Tool execution failed',
        }
      }

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      })
    }
  }

  return 'Lo siento, tuve un problema procesando tu mensaje. En breve te contacta alguien del equipo.'
}

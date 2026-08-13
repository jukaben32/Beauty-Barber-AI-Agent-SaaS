'use client'
import React from 'react'
import { Bot, User } from 'lucide-react'

export type TranscriptRole = 'agent' | 'caller' | 'system'

export type TranscriptMessage = {
  id: string
  role: TranscriptRole
  content: string
  createdAt: string
}

type TranscriptPanelProps = {
  messages: TranscriptMessage[]
  isLoading?: boolean
  className?: string
}

const ROLE_CONFIG: Record<TranscriptRole, { icon: React.ReactNode; align: string }> = {
  agent: { icon: <Bot className="h-4 w-4" />, align: 'flex-start' },
  caller: { icon: <User className="h-4 w-4" />, align: 'flex-end' },
  system: { icon: null, align: 'center' },
}

export const TranscriptPanel = React.memo(function TranscriptPanel({
  messages,
  isLoading = false,
  className = '',
}: TranscriptPanelProps) {
  return (
    <div
      className={`flex flex-col gap-3 overflow-y-auto p-4 ${className}`}
      style={{ maxHeight: '320px' }}
    >
      {messages.length === 0 && !isLoading && (
        <div className="py-6 text-center text-sm text-[var(--text-muted)]">
          Inicia la conversación. Clara está esperando.
        </div>
      )}

      {messages.map((message) => {
        const config = ROLE_CONFIG[message.role]
        const isOwn = message.role === 'caller'
        return (
          <div
            key={message.id}
            className="flex gap-2.5"
            style={{ justifyContent: message.role === 'system' ? 'center' : config.align }}
          >
            {message.role !== 'system' && (
              <div
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                style={{ background: isOwn ? 'var(--brand)' : 'rgba(21, 57, 142,0.08)' }}
              >
                {config.icon}
              </div>
            )}
            <div
              className="max-w-[75%] rounded-[20px] px-4 py-2.5 text-sm"
              style={{
                background: message.role === 'caller' ? 'var(--brand-soft)' : 'rgba(248,250,252,1)',
                color: message.role === 'caller' ? 'var(--brand-strong)' : 'var(--text-strong)',
                alignSelf: isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              {message.content}
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex gap-2.5">
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgba(21, 57, 142,0.08)]">
            <Bot className="h-4 w-4 animate-pulse" />
          </div>
          <div className="rounded-[20px] bg-[rgba(248,250,252,1)] px-4 py-2.5">
            <span className="text-sm text-[var(--text-muted)]">Clara está pensando…</span>
          </div>
        </div>
      )}
    </div>
  )
})

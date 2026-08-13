"use client"

import { useEffect, useState } from 'react'
import { ChevronRight, CircleAlert, Clock3, Loader2, MessageSquareMore, PhoneCall, Search } from 'lucide-react'

import type { Conversation, ConversationMessage, Client } from '@/types'
import Modal from '@/components/ui/Modal'
import { StatusBadge, SurfaceCard } from '@/components/dashboard/shared'

type ConversationStatusFilter = 'all' | 'active' | 'completed' | 'failed'

type TranscriptPayload = {
  conversation: Conversation
  messages: ConversationMessage[]
}

const STATUS_OPTIONS: Array<{ label: string; value: ConversationStatusFilter }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
]

const STATUS_META = {
  in_progress: { label: 'active', tone: 'blue' as const },
  completed: { label: 'completed', tone: 'emerald' as const },
  failed: { label: 'failed', tone: 'rose' as const },
}

const SENTIMENT_META = {
  positive: { label: 'positive', tone: 'emerald' as const },
  neutral: { label: 'neutral', tone: 'slate' as const },
  negative: { label: 'negative', tone: 'rose' as const },
}

const CHANNEL_LABELS: Record<Conversation['channel'], string> = {
  phone: 'Phone',
  widget_chat: 'Widget chat',
  widget_voice: 'Widget voice',
  whatsapp: 'WhatsApp',
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')
const RELATIVE_TIME = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60

  if (minutes > 59) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function formatExactDate(iso: string, timeZone: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso)
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 60) {
    return RELATIVE_TIME.format(diffSeconds, 'second')
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_TIME.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffSeconds / 3600)
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_TIME.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffSeconds / 86400)
  return RELATIVE_TIME.format(diffDays, 'day')
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getClientInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getConversationStatus(conversation: Conversation) {
  return STATUS_META[conversation.status] ?? STATUS_META.failed
}

function getSentimentMeta(sentiment: Conversation['sentiment']) {
  if (!sentiment) return null
  return SENTIMENT_META[sentiment]
}

function isBookedConversation(conversation: Conversation) {
  return conversation.outcome === 'booked_appointment' || Boolean(conversation.appointmentId)
}

function getChannelLabel(channel: Conversation['channel']) {
  return CHANNEL_LABELS[channel] ?? channel
}

function buildSearchText(client: Client | null | undefined, conversation: Conversation) {
  return normalizeSearch(
    [
      client?.name ?? 'unknown caller',
      client?.phone ?? '',
      conversation.transcriptSummary ?? '',
      conversation.status,
      conversation.outcome ?? '',
      getChannelLabel(conversation.channel),
    ].join(' '),
  )
}

function TranscriptMessage({ message }: { message: ConversationMessage }) {
  const isCaller = message.role === 'caller'
  const isSystem = message.role === 'system'
  const isAgent = message.role === 'agent'
  const badgeText = isSystem ? 'SYS' : isAgent ? 'AI' : 'PT'
  const badgeBg = isSystem ? 'var(--text-muted)' : isAgent ? 'var(--brand)' : 'var(--text-strong)'
  const badgeTextClass = isCaller ? 'text-[var(--text-strong)]' : 'text-white'
  const bubbleTone = isAgent
    ? 'border-[rgba(19,122,114,0.18)] bg-[rgba(19,122,114,0.08)] text-[var(--text-strong)]'
    : isCaller
      ? 'border-[var(--border-soft)] bg-white/90 text-[var(--text-strong)]'
      : 'border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]'

  return (
    <div className="flex items-start gap-3">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${badgeTextClass}`}
        style={{
          background: badgeBg,
          borderColor: isSystem ? 'var(--border-soft)' : 'transparent',
        }}
      >
        {badgeText}
      </div>
      <div className={`flex-1 rounded-[18px] border px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,33,41,0.3)] ${bubbleTone}`}>
        <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
        {isSystem ? <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">system event</div> : null}
      </div>
    </div>
  )
}

export function ConversationsManager({
  initialConversations,
  clients,
  timezone,
  businessName,
}: {
  initialConversations: Conversation[]
  clients: Client[]
  timezone: string
  businessName: string
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConversationStatusFilter>('all')
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [transcriptCache, setTranscriptCache] = useState<Record<string, TranscriptPayload>>({})
  const [transcriptStatus, setTranscriptStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [transcriptError, setTranscriptError] = useState<string | null>(null)

  const clientById = Object.fromEntries(clients.map((client) => [client.id, client] as const)) as Record<string, Client>

  const visibleConversations = initialConversations.filter((conversation) => {
    const client = conversation.clientId ? clientById[conversation.clientId] : null
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? conversation.status === 'in_progress'
          : conversation.status === statusFilter
    if (!matchesStatus) return false

    const searchText = buildSearchText(client, conversation)
    const matchesQuery = query.trim() === '' ? true : searchText.includes(normalizeSearch(query))
    return matchesQuery
  })

  const totalCalls = initialConversations.length
  const bookedCalls = initialConversations.filter(isBookedConversation).length
  const activeCalls = initialConversations.filter((conversation) => conversation.status === 'in_progress').length
  const selectedConversation = selectedConversationId
    ? initialConversations.find((conversation) => conversation.id === selectedConversationId) ?? null
    : null
  const selectedTranscript = selectedConversationId ? transcriptCache[selectedConversationId] ?? null : null
  const selectedClient = selectedConversation?.clientId ? clientById[selectedConversation.clientId] : null

  const [transcriptSyncKey, setTranscriptSyncKey] = useState({ selectedConversationId, transcriptCache })
  if (
    transcriptSyncKey.selectedConversationId !== selectedConversationId ||
    transcriptSyncKey.transcriptCache !== transcriptCache
  ) {
    setTranscriptSyncKey({ selectedConversationId, transcriptCache })
    if (selectedConversationId && transcriptCache[selectedConversationId]) {
      setTranscriptStatus('ready')
      setTranscriptError(null)
    }
  }

  useEffect(() => {
    if (!selectedConversationId) return
    const conversationId = selectedConversationId

    const cached = transcriptCache[conversationId]
    if (cached) {
      return
    }

    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setting loading state before an async fetch, not a render-sync anti-pattern
    setTranscriptStatus('loading')
    setTranscriptError(null)

    async function loadTranscript() {
      try {
        const response = await fetch(`/api/conversations?conversationId=${conversationId}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Unable to load transcript (${response.status})`)
        }
        const data = (await response.json()) as { conversation?: Conversation; messages?: ConversationMessage[] }
        if (controller.signal.aborted) return
        if (!data.conversation || !Array.isArray(data.messages)) {
          throw new Error('Transcript payload is incomplete')
        }
        const transcriptPayload: TranscriptPayload = {
          conversation: data.conversation,
          messages: data.messages,
        }

        setTranscriptCache((current) => ({
          ...current,
          [conversationId]: transcriptPayload,
        }))
        setTranscriptStatus('ready')
      } catch (error) {
        if (controller.signal.aborted) return
        setTranscriptStatus('error')
        setTranscriptError(error instanceof Error ? error.message : 'Unable to load transcript')
      }
    }

    loadTranscript()

    return () => {
      controller.abort()
    }
  }, [selectedConversationId, transcriptCache])

  const selectedMessages = selectedConversationId ? selectedTranscript?.messages ?? [] : []
  const activeTranscript = selectedTranscript?.conversation ?? selectedConversation
  const transcriptTitle = activeTranscript
    ? `${formatExactDate(activeTranscript.startedAt, timezone)} · ${selectedClient?.name ?? 'Unknown caller'}`
    : ''
  const transcriptSummary = activeTranscript?.transcriptSummary ?? selectedTranscript?.conversation.transcriptSummary ?? null
  const tableGridTemplate = 'minmax(0,1.7fr) minmax(0,0.82fr) minmax(0,0.82fr) minmax(0,0.82fr) minmax(0,0.82fr) minmax(0,0.95fr) 44px'

  function openTranscript(conversationId: string) {
    setSelectedConversationId(conversationId)
  }

  function closeTranscript() {
    setSelectedConversationId(null)
    setTranscriptStatus('idle')
    setTranscriptError(null)
  }

  return (
    <div className="space-y-5">
      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-[var(--border-soft)] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/78 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)] backdrop-blur-sm">
              Call Log
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text-strong)] md:text-4xl">
              Client call history and transcripts
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--text-muted)]">
              Review every call in real time, filter by status, and open the transcript from the duration chip or chevron.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[420px] lg:flex-col lg:items-end">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <label className="relative flex-1 sm:min-w-[300px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by client name or phone..."
                  className="h-12 w-full rounded-full border border-[var(--border-soft)] bg-white/86 pl-11 pr-20 text-sm text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/40 focus:ring-2 focus:ring-[var(--brand)]/12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Ctrl K
                </span>
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as ConversationStatusFilter)}
                  className="h-12 w-full min-w-[180px] appearance-none rounded-full border border-[var(--border-soft)] bg-white/86 px-4 pr-10 text-sm text-[var(--text-strong)] outline-none transition focus:border-[var(--brand)]/40 focus:ring-2 focus:ring-[var(--brand)]/12"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">v</span>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-3 text-[11px] font-medium text-[var(--text-muted)] lg:w-auto lg:justify-end">
              <StatusBadge tone="slate">{businessName}</StatusBadge>
              <div className="flex flex-wrap items-center gap-2">
                <span>{NUMBER_FORMAT.format(totalCalls)} total</span>
                <span>•</span>
                <span>{NUMBER_FORMAT.format(bookedCalls)} booked</span>
                <span>•</span>
                <span>{NUMBER_FORMAT.format(activeCalls)} active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid gap-3 border-b border-[var(--border-soft)] bg-[rgba(16,33,41,0.03)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]"
            style={{ gridTemplateColumns: tableGridTemplate }}
          >
            <div>Client</div>
            <div>Status</div>
            <div>Duration</div>
            <div>Sentiment</div>
            <div>Appointment</div>
            <div>Started</div>
            <div />
          </div>

          <div className="divide-y divide-[var(--border-soft)]">
            {visibleConversations.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]">
                  <MessageSquareMore className="h-6 w-6" />
                </div>
                <div className="mt-4 font-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                  No calls match your filters
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                  Try another client name, phone number, or call status.
                </p>
              </div>
            ) : (
              visibleConversations.map((conversation) => {
                const client = conversation.clientId ? clientById[conversation.clientId] : null
                const clientName = client?.name ?? 'Unknown caller'
                const clientPhone = client?.phone ?? 'No phone'
                const clientInitials = getClientInitials(clientName)
                const statusMeta = getConversationStatus(conversation)
                const sentimentMeta = getSentimentMeta(conversation.sentiment)
                const durationLabel = conversation.durationSeconds > 0 ? formatDuration(conversation.durationSeconds) : '-'
                const startedLabel = formatRelativeTime(conversation.startedAt)
                const startedTitle = formatExactDate(conversation.startedAt, timezone)
                const appointmentBooked = isBookedConversation(conversation)

                return (
                  <div
                    key={conversation.id}
                    className="grid gap-3 px-6 py-4 transition hover:bg-[var(--panel-soft)]/70"
                    style={{ gridTemplateColumns: tableGridTemplate }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[var(--brand)] text-[11px] font-semibold text-white shadow-[0_16px_30px_-20px_rgba(19,122,114,0.7)]">
                        {clientInitials || 'UC'}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--text-strong)]">{clientName}</div>
                        <div className="truncate text-xs text-[var(--text-muted)]">{clientPhone}</div>
                        {client?.dateOfBirth ? (
                          <div className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                            {`DOB: ${client.dateOfBirth}`}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                    </div>

                    <div className="flex items-center">
                      {durationLabel !== '-' ? (
                        <button
                          type="button"
                          onClick={() => openTranscript(conversation.id)}
                          aria-label={`Open transcript for ${clientName}`}
                          title={`Open transcript for ${clientName}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/80 px-3 py-1.5 text-sm font-semibold text-[var(--brand-strong)] transition hover:border-[var(--brand)]/25 hover:bg-[var(--brand-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                        >
                          <Clock3 className="h-3.5 w-3.5" />
                          {durationLabel}
                        </button>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">-</span>
                      )}
                    </div>

                    <div className="flex items-center">
                      {sentimentMeta ? (
                        <StatusBadge tone={sentimentMeta.tone}>{sentimentMeta.label}</StatusBadge>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">-</span>
                      )}
                    </div>

                    <div className="flex items-center">
                      {appointmentBooked ? (
                        <StatusBadge tone="emerald">Booked</StatusBadge>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">-</span>
                      )}
                    </div>

                    <div className="flex items-center text-sm text-[var(--text-muted)]" title={startedTitle}>
                      {startedLabel}
                    </div>

                    <div className="flex items-center justify-end text-[var(--text-muted)]">
                      <button
                        type="button"
                        onClick={() => openTranscript(conversation.id)}
                        aria-label={`Open transcript for ${clientName}`}
                        title={`Open transcript for ${clientName}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/80 text-[var(--text-muted)] transition hover:border-[var(--brand)]/25 hover:text-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </SurfaceCard>

      <Modal
        open={Boolean(selectedConversationId)}
        onClose={closeTranscript}
        title="Call Transcript"
        description={activeTranscript ? transcriptTitle : undefined}
        className="max-w-[720px]"
      >
        <div className="space-y-5">
          {activeTranscript ? (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={getConversationStatus(activeTranscript).tone}>
                {getConversationStatus(activeTranscript).label}
              </StatusBadge>
              {isBookedConversation(activeTranscript) ? <StatusBadge tone="emerald">Booked</StatusBadge> : null}
              <StatusBadge tone="slate">{activeTranscript.durationSeconds > 0 ? formatDuration(activeTranscript.durationSeconds) : 'No duration'}</StatusBadge>
            </div>
          ) : null}

          {transcriptStatus === 'loading' ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
              <div className="mt-4 font-semibold text-[var(--text-strong)]">Loading transcript</div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Fetching the call details and messages.</p>
            </div>
          ) : transcriptStatus === 'error' ? (
            <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              <div className="flex items-center gap-2 font-semibold">
                <CircleAlert className="h-4 w-4" />
                We could not load this transcript
              </div>
              <div className="mt-2">{transcriptError ?? 'Please try again in a moment.'}</div>
            </div>
          ) : selectedMessages.length === 0 ? (
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,240,231,0.7))] px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--panel-soft)] text-[var(--text-muted)]">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">No transcript available</div>
              {transcriptSummary ? (
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{transcriptSummary}</p>
              ) : (
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                  This call was logged, but no transcript messages were saved.
                </p>
              )}
            </div>
          ) : (
            <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
              {selectedMessages.map((message) => (
                <TranscriptMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

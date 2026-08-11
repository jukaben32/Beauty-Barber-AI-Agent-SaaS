'use client'

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  Mail,
  Paperclip,
  Phone,
  Send,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react'
import type { SupportMessage, SupportTicket, SupportTicketStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { appendSupportMessage, listSupportMessages, updateSupportTicketStatus } from '@/services/support'
import { cn } from '@/lib/utils'
import { SectionEyebrow, SurfaceCard, StatusBadge } from '@/components/dashboard/shared'
import { formatDateOnlyInTimeZone, formatDateTimeInTimeZone } from './appointments-utils'

type SupportMessagePayload = {
  text: string
  attachment: {
    name: string
    type: string | null
    size: number
  } | null
}

const STATUS_META: Record<SupportTicketStatus, { label: string; tone: 'teal' | 'rose' | 'amber' | 'emerald' | 'slate' }> = {
  open: { label: 'Open', tone: 'teal' },
  pending: { label: 'In Progress', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'emerald' },
  closed: { label: 'Closed', tone: 'slate' },
}

const PRIORITY_META: Record<SupportTicket['priority'], { label: string; tone: 'rose' | 'amber' | 'emerald' | 'slate' }> = {
  low: { label: 'Low', tone: 'slate' },
  medium: { label: 'Medium', tone: 'amber' },
  high: { label: 'High', tone: 'rose' },
  urgent: { label: 'Urgent', tone: 'rose' },
}

const STATUS_OPTIONS: SupportTicketStatus[] = ['open', 'pending', 'resolved', 'closed']

function sortTickets(items: SupportTicket[]) {
  return [...items].sort((a, b) => {
    const updatedA = new Date(a.updatedAt).getTime()
    const updatedB = new Date(b.updatedAt).getTime()
    if (updatedA !== updatedB) return updatedB - updatedA
    const createdA = new Date(a.createdAt).getTime()
    const createdB = new Date(b.createdAt).getTime()
    return createdB - createdA
  })
}

function formatTicketDate(iso: string, timezone: string) {
  return formatDateOnlyInTimeZone(iso, timezone)
}

function formatTicketTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function initials(value: string | null | undefined, fallback = 'PT') {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function parseMessageContent(content: string): SupportMessagePayload {
  try {
    const parsed = JSON.parse(content) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'text' in parsed) {
      const text = typeof (parsed as { text: unknown }).text === 'string' ? (parsed as { text: string }).text : ''
      const attachmentValue = (parsed as { attachment?: unknown }).attachment
      const attachment =
        attachmentValue && typeof attachmentValue === 'object' && !Array.isArray(attachmentValue)
          ? {
              name: typeof (attachmentValue as { name?: unknown }).name === 'string' ? (attachmentValue as { name: string }).name : 'Attached file',
              type: typeof (attachmentValue as { type?: unknown }).type === 'string' ? (attachmentValue as { type: string }).type : null,
              size: typeof (attachmentValue as { size?: unknown }).size === 'number' ? (attachmentValue as { size: number }).size : 0,
            }
          : null

      return { text, attachment }
    }
  } catch {
    // Plain text support messages stay untouched.
  }

  return { text: content, attachment: null }
}

function serializeReply(text: string, attachment: File | null) {
  const normalizedText = text.trim()
  if (!attachment) return normalizedText

  return JSON.stringify({
    text: normalizedText,
    attachment: {
      name: attachment.name,
      type: attachment.type || null,
      size: attachment.size,
    },
  })
}

function SupportTicketBadge({
  status,
  busy,
  onClick,
}: {
  status: SupportTicketStatus
  busy?: boolean
  onClick: () => void
}) {
  const meta = STATUS_META[status]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition',
        'hover:-translate-y-0.5 hover:bg-white',
        busy
          ? 'border-[var(--border-strong)] bg-[var(--panel-soft)] text-[var(--text-muted)]'
          : 'border-[var(--border-soft)] bg-white/78 text-[var(--text-strong)]',
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {meta.label}
    </button>
  )
}

function TicketCard({
  ticket,
  active,
  timezone,
  onClick,
}: {
  ticket: SupportTicket
  active: boolean
  timezone: string
  onClick: () => void
}) {
  const clientName = ticket.client?.name ?? 'Client'
  const priorityMeta = PRIORITY_META[ticket.priority]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-[24px] border px-4 py-4 text-left transition',
        active
          ? 'border-[var(--brand)] bg-[var(--brand-soft)]/30 shadow-[0_16px_40px_-34px_rgba(19,122,114,0.7)]'
          : 'border-[var(--border-soft)] bg-white/78 hover:border-[var(--border-strong)] hover:bg-white',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/70 text-xs font-semibold text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }}
        >
          {initials(clientName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-display text-base font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                {ticket.subject}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-[var(--text-muted)]">
                <UserRound className="h-3.5 w-3.5" />
                <span className="truncate">{clientName}</span>
              </div>
            </div>

            <StatusBadge tone={STATUS_META[ticket.status].tone}>{STATUS_META[ticket.status].label}</StatusBadge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white/72 px-2.5 py-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              {priorityMeta.label} priority
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white/72 px-2.5 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTicketDate(ticket.createdAt, timezone)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            {ticket.client?.email ? (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-2.5 py-1">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{ticket.client.email}</span>
              </span>
            ) : null}
            {ticket.client?.phone ? (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-2.5 py-1">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{ticket.client.phone}</span>
              </span>
            ) : null}
            {!ticket.client?.email && !ticket.client?.phone ? (
              <span className="truncate">{ticket.description ?? 'Client request'}</span>
            ) : null}
          </div>

          {ticket.description ? (
            <div className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">{ticket.description}</div>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function ThreadMessage({
  message,
  timezone,
}: {
  message: SupportMessage
  timezone: string
}) {
  const parsed = parseMessageContent(message.content)
  const isStaff = message.senderType === 'staff'
  const isSystem = message.senderType === 'system'
  const label = isStaff ? 'You' : message.senderType === 'client' ? 'Client' : 'System'
  const timeLabel = formatTicketTime(message.createdAt, timezone)

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]">
          {parsed.text}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-3', isStaff ? 'justify-end' : 'justify-start')}>
      {!isStaff ? (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border-soft)] bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-strong)]">
          P
        </div>
      ) : null}

      <div
        className={cn(
          'max-w-[82%] rounded-[22px] border px-4 py-3 shadow-[0_10px_28px_-24px_rgba(15,33,41,0.45)]',
          isStaff
            ? 'border-[transparent] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-white'
            : 'border-[var(--border-soft)] bg-white/92 text-[var(--text-strong)]',
        )}
      >
        <div className={cn('flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em]', isStaff ? 'text-white/72' : 'text-[var(--text-muted)]')}>
          <span>{label}</span>
          <span>{timeLabel}</span>
        </div>

        {parsed.attachment ? (
          <div
            className={cn(
              'mt-3 flex items-start gap-3 rounded-[18px] border px-3 py-2',
              isStaff ? 'border-white/15 bg-white/10' : 'border-[var(--border-soft)] bg-[var(--panel-soft)]',
            )}
          >
            <div
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border',
                isStaff ? 'border-white/15 bg-white/10 text-white' : 'border-[var(--border-soft)] bg-white text-[var(--brand-strong)]',
              )}
            >
              <Paperclip className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className={cn('truncate text-sm font-semibold', isStaff ? 'text-white' : 'text-[var(--text-strong)]')}>
                {parsed.attachment.name}
              </div>
              <div className={cn('text-xs', isStaff ? 'text-white/70' : 'text-[var(--text-muted)]')}>
                {parsed.attachment.type ? parsed.attachment.type.replace('image/', '').toUpperCase() : 'File'} - {formatBytes(parsed.attachment.size)}
              </div>
            </div>
          </div>
        ) : null}

        {parsed.text ? (
          <div className={cn('mt-3 whitespace-pre-line text-sm leading-6', isStaff ? 'text-white' : 'text-[var(--text-strong)]')}>
            {parsed.text}
          </div>
        ) : null}
      </div>

      {isStaff ? (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--brand)] bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-strong)]">
          Y
        </div>
      ) : null}
    </div>
  )
}

function ThreadAttachmentNote({
  description,
}: {
  description: string | null
}) {
  if (!description) return null

  return (
    <div className="rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,249,248,0.95))] p-4 shadow-[0_14px_34px_-30px_rgba(15,33,41,0.35)]">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
        <FileText className="h-4 w-4 text-[var(--brand)]" />
        Client note
      </div>
      <div className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--text-strong)]">{description}</div>
    </div>
  )
}

function SupportComposer({
  value,
  attachment,
  onChange,
  onSubmit,
  onAttach,
  onRemoveAttachment,
  sending,
}: {
  value: string
  attachment: File | null
  onChange: (value: string) => void
  onSubmit: () => void
  onAttach: () => void
  onRemoveAttachment: () => void
  sending: boolean
}) {
  const canSend = value.trim().length > 0 || attachment !== null

  return (
    <form
      className="border-t border-[var(--border-soft)] bg-[rgba(255,255,255,0.72)] px-5 py-4 backdrop-blur-sm"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {attachment ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--text-strong)]">{attachment.name}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {attachment.type || 'file'} - {formatBytes(attachment.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveAttachment}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--border-soft)] bg-white/80 text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3 rounded-[24px] border border-[var(--border-soft)] bg-white/92 px-4 py-3 shadow-[0_14px_34px_-30px_rgba(15,33,41,0.3)]">
        <button
          type="button"
          onClick={onAttach}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your reply... (Enter to send)"
          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0"
        />
        <button
          type="submit"
          disabled={!canSend || sending}
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition',
            canSend && !sending
              ? 'bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] hover:-translate-y-0.5'
              : 'cursor-not-allowed bg-[var(--text-muted)]/40',
          )}
          aria-label="Send reply"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </form>
  )
}

export function SupportManager({
  initialTickets,
  businessId,
  timezone,
  businessName,
}: {
  initialTickets: SupportTicket[]
  businessId: string
  timezone: string
  businessName: string
}) {
  const [tickets, setTickets] = useState(() => sortTickets(initialTickets))
  const [selectedId, setSelectedId] = useState<string | null>(() => sortTickets(initialTickets)[0]?.id ?? null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [statusBusy, setStatusBusy] = useState<SupportTicketStatus | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const endOfThreadRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setTickets(sortTickets(initialTickets))
  }, [initialTickets])

  useEffect(() => {
    if (tickets.length === 0) {
      setSelectedId(null)
      return
    }

    if (!selectedId || !tickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(tickets[0].id)
    }
  }, [tickets, selectedId])

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null
  const selectedStatusMeta = selected ? STATUS_META[selected.status] : null
  const selectedClientName = selected?.client?.name ?? 'Client'
  const selectedOpenedLabel = selected ? formatTicketDate(selected.createdAt, timezone) : ''
  const selectedUpdatedLabel = selected ? formatTicketTime(selected.updatedAt, timezone) : ''
  const selectedAppointmentLabel =
    selected?.appointment != null ? formatDateTimeInTimeZone(selected.appointment.scheduledAt, timezone) : null

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      setThreadError(null)
      return
    }

    let cancelled = false
    setLoadingMessages(true)
    setThreadError(null)
    setReply('')
    setAttachment(null)

    const supabase = createClient()
    listSupportMessages(supabase, businessId, selectedId)
      .then((data) => {
        if (cancelled) return
        setMessages(data)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setMessages([])
        setThreadError(error instanceof Error ? error.message : 'No se pudo cargar el hilo de soporte')
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMessages(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, businessId])

  useEffect(() => {
    endOfThreadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, selectedId])

  function handleAttachClick() {
    fileInputRef.current?.click()
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setAttachment(file)
  }

  async function handleReply(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!selectedId || (!reply.trim() && !attachment)) return

    setSending(true)
    setThreadError(null)

    try {
      const supabase = createClient()
      const message = await appendSupportMessage(supabase, businessId, selectedId, {
        senderType: 'staff',
        content: serializeReply(reply, attachment),
      })
      setMessages((prev) => [...prev, message])
      setReply('')
      setAttachment(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : 'No se pudo enviar la respuesta')
    } finally {
      setSending(false)
    }
  }

  async function changeStatus(status: SupportTicketStatus) {
    if (!selectedId || !selected || selected.status === status) return

    setStatusBusy(status)
    setThreadError(null)

    try {
      const supabase = createClient()
      const updated = await updateSupportTicketStatus(supabase, businessId, selectedId, status)
      setTickets((prev) => sortTickets(prev.map((ticket) => (ticket.id === updated.id ? { ...ticket, ...updated } : ticket))))
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : 'No se pudo actualizar el estado del ticket')
    } finally {
      setStatusBusy(null)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,241,233,0.92))] px-5 py-5">
          <SectionEyebrow>Support Tickets</SectionEyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
            Client requests
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
            Reply to portal issues, attachments, and chat threads without losing context.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <StatusBadge tone="slate">{tickets.length} total</StatusBadge>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">{businessName}</span>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          {tickets.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold text-[var(--text-strong)]">No support tickets yet</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Client messages will appear here as soon as they arrive.
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                active={ticket.id === selectedId}
                timezone={timezone}
                onClick={() => setSelectedId(ticket.id)}
              />
            ))
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="flex min-h-[720px] flex-col overflow-hidden p-0">
        {!selected ? (
          <div className="grid flex-1 place-items-center px-6 py-16 text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                <FileText className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                Select a ticket
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-muted)]">
                Choose a client request from the list to review the thread and reply in real time.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,241,233,0.92))] px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Thread</div>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                    {selected.subject}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      {selectedClientName}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Opened {selectedOpenedLabel}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      Updated {selectedUpdatedLabel}
                    </span>
                    {selectedAppointmentLabel ? (
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {selectedAppointmentLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <SupportTicketBadge
                      key={status}
                      status={status}
                      busy={statusBusy === status}
                      onClick={() => void changeStatus(status)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge tone={selectedStatusMeta?.tone ?? 'slate'}>{selectedStatusMeta?.label ?? selected.status}</StatusBadge>
                <StatusBadge tone={PRIORITY_META[selected.priority].tone}>{PRIORITY_META[selected.priority].label} priority</StatusBadge>
                {selected.appointment ? (
                  <StatusBadge tone="slate">Appointment {formatDateOnlyInTimeZone(selected.appointment.scheduledAt, timezone)}</StatusBadge>
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {threadError ? (
                <div className="mb-5 rounded-[22px] border border-[var(--coral)] bg-[var(--coral-soft)] px-4 py-3 text-sm text-[var(--coral)]">
                  {threadError}
                </div>
              ) : null}

              <div className="space-y-4">
                {selected.description ? <ThreadAttachmentNote description={selected.description} /> : null}

                {loadingMessages ? (
                  <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/82 px-4 py-5 text-sm text-[var(--text-muted)]">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading conversation...
                  </div>
                ) : null}

                {!loadingMessages && messages.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-12 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[var(--brand-strong)] shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="mt-4 font-semibold text-[var(--text-strong)]">No messages yet</div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                      This ticket is ready for the first reply from the clinic.
                    </p>
                  </div>
                ) : null}

                {messages.map((message) => (
                  <ThreadMessage key={message.id} message={message} timezone={timezone} />
                ))}

                <div ref={endOfThreadRef} />
              </div>
            </div>

            <SupportComposer
              value={reply}
              attachment={attachment}
              onChange={setReply}
              onSubmit={() => void handleReply()}
              onAttach={handleAttachClick}
              onRemoveAttachment={() => {
                setAttachment(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              sending={sending}
            />

            <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachmentChange} />
          </>
        )}
      </SurfaceCard>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock3, FileText, Loader2, Plus, Send } from 'lucide-react'
import type { SupportMessage, SupportTicket } from '@/types'
import { SectionEyebrow, SurfaceCard, StatusBadge } from '@/components/dashboard/shared'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { formatDateOnlyInTimeZone } from '@/components/dashboard/appointments-utils'

const STATUS_META: Record<SupportTicket['status'], { label: string; tone: 'teal' | 'rose' | 'amber' | 'emerald' | 'slate' }> = {
  open: { label: 'Open', tone: 'teal' },
  pending: { label: 'In progress', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'emerald' },
  closed: { label: 'Closed', tone: 'slate' },
}

function sortTickets(items: SupportTicket[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function formatTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function PortalSupportManager({
  initialTickets,
  timezone,
}: {
  initialTickets: SupportTicket[]
  timezone: string
}) {
  const [tickets, setTickets] = useState(() => sortTickets(initialTickets))
  const [selectedId, setSelectedId] = useState<string | null>(() => sortTickets(initialTickets)[0]?.id ?? null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const endOfThreadRef = useRef<HTMLDivElement | null>(null)

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    let cancelled = false
    setLoadingMessages(true)
    setThreadError(null)
    fetch(`/api/portal/support/${selectedId}/messages`)
      .then((res) => res.json())
      .then((payload) => {
        if (!cancelled) setMessages(payload?.messages ?? [])
      })
      .catch(() => {
        if (!cancelled) setThreadError('Could not load this conversation.')
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  useEffect(() => {
    endOfThreadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  async function handleReply() {
    if (!selectedId || !reply.trim()) return
    setSending(true)
    setThreadError(null)
    try {
      const response = await fetch(`/api/portal/support/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply.trim() }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setThreadError(payload?.error || 'Could not send your message.')
        return
      }
      setMessages((prev) => [...prev, payload.message])
      setReply('')
    } catch {
      setThreadError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleCreated(ticket: SupportTicket) {
    setTickets((prev) => sortTickets([ticket, ...prev]))
    setSelectedId(ticket.id)
    setNewTicketOpen(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-[var(--border-soft)] px-5 py-5">
          <SectionEyebrow>Support</SectionEyebrow>
          <div className="mt-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">Your tickets</h2>
            <button
              type="button"
              onClick={() => setNewTicketOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)]"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>

        <div className="space-y-2 px-4 py-4">
          {tickets.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              No support tickets yet.
            </div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={cn(
                  'w-full rounded-[22px] border px-4 py-3 text-left transition',
                  ticket.id === selectedId
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]/40'
                    : 'border-[var(--border-soft)] bg-white hover:bg-[var(--panel-soft)]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-bold text-[var(--text-strong)]">{ticket.subject}</div>
                  <StatusBadge tone={STATUS_META[ticket.status].tone}>{STATUS_META[ticket.status].label}</StatusBadge>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDateOnlyInTimeZone(ticket.createdAt, timezone)}
                </div>
              </button>
            ))
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="flex min-h-[560px] flex-col overflow-hidden p-0">
        {!selected ? (
          <div className="grid flex-1 place-items-center px-6 py-16 text-center text-sm text-[var(--text-muted)]">
            Select a ticket, or open a new one to get help from the clinic.
          </div>
        ) : (
          <>
            <div className="border-b border-[var(--border-soft)] px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black tracking-tight text-[var(--text-strong)]">{selected.subject}</h2>
                <StatusBadge tone={STATUS_META[selected.status].tone}>{STATUS_META[selected.status].label}</StatusBadge>
              </div>
              {selected.description ? (
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{selected.description}</p>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {threadError ? <p className="mb-4 text-sm font-medium text-[var(--coral)]">{threadError}</p> : null}

              {loadingMessages ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  No replies yet. The clinic will respond here.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isClient = message.senderType === 'client'
                    if (message.senderType === 'system') {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
                            {message.content}
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={message.id} className={cn('flex', isClient ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[80%] rounded-[20px] border px-4 py-3 text-sm leading-6',
                            isClient
                              ? 'border-transparent bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-white'
                              : 'border-[var(--border-soft)] bg-white text-[var(--text-strong)]'
                          )}
                        >
                          <div className={cn('mb-1 text-[10px] font-semibold uppercase tracking-[0.2em]', isClient ? 'text-white/70' : 'text-[var(--text-muted)]')}>
                            {isClient ? 'You' : 'Clinic'} - {formatTime(message.createdAt, timezone)}
                          </div>
                          {message.content}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={endOfThreadRef} />
                </div>
              )}
            </div>

            {selected.status !== 'closed' ? (
              <form
                className="border-t border-[var(--border-soft)] px-5 py-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleReply()
                }}
              >
                <div className="flex items-center gap-3 rounded-full border border-[var(--border-soft)] bg-white px-4 py-2">
                  <input
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-[var(--text-strong)] outline-none focus:ring-0"
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim() || sending}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-[var(--border-soft)] px-5 py-4 text-center text-sm text-[var(--text-muted)]">
                This ticket is closed.
              </div>
            )}
          </>
        )}
      </SurfaceCard>

      <NewTicketModal open={newTicketOpen} onClose={() => setNewTicketOpen(false)} onCreated={handleCreated} />
    </div>
  )
}

function NewTicketModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (ticket: SupportTicket) => void
}) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setSubject('')
    setDescription('')
    setError(null)
  }

  async function handleSubmit() {
    if (!subject.trim()) {
      setError('Enter a subject for your request.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/portal/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim() || null }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'Could not open the ticket.')
        return
      }
      onCreated(payload.ticket)
      reset()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Open a support ticket"
      description="Tell the clinic what you need. They'll reply here."
      onClose={() => {
        reset()
        onClose()
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--text-strong)]">Subject</label>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Reschedule request" className="input-field w-full" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--text-strong)]">Details (optional)</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="input-field w-full"
            placeholder="Add any context that will help the clinic respond..."
          />
        </div>
        {error ? <p className="text-sm font-medium text-[var(--coral)]">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center py-3">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Open ticket
          </button>
          <button
            type="button"
            onClick={() => {
              reset()
              onClose()
            }}
            className="btn-secondary flex-1 justify-center py-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

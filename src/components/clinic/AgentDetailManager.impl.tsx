'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Loader2,
  Mic,
  PhoneCall,
  PhoneOff,
  Sparkles,
  Stethoscope,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import type { AiAgent, ClinicService } from '@/types'
import { deleteAgent, updateAgent } from '@/services/agents'
import { findOrCreatePatient } from '@/services/patients'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Tabs from '@/components/ui/Tabs'
import Toast from '@/components/ui/Toast'
import { MetricCard, SectionEyebrow, SectionHeading, StatusBadge, SurfaceCard } from '@/components/clinic/shared'
import {
  DEFAULT_AGENT_PROMPT,
  LANGUAGE_OPTIONS,
  PERSONALITY_OPTIONS,
  SENSITIVITY_OPTIONS,
  VOICE_OPTIONS,
  type AgentSensitivityPreset,
} from '@/components/clinic/agent-templates'

type ToastTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

type ManagerToast = {
  id: string
  title: string
  message?: string
  tone?: ToastTone
}

type DetailFormState = {
  name: string
  voice: string
  personality: string
  sensitivity: AgentSensitivityPreset
  greetingMessage: string
  systemPrompt: string
  language: string
}

const STATUS_TONE: Record<AiAgent['status'], 'emerald' | 'amber' | 'slate'> = {
  live: 'emerald',
  paused: 'amber',
  draft: 'slate',
}

const STATUS_LABEL: Record<AiAgent['status'], string> = {
  live: 'Active',
  paused: 'Paused',
  draft: 'Draft',
}

function pickSensitivityPreset(value: number) {
  if (value <= 0.33) return 'gentle'
  if (value >= 0.66) return 'decisive'
  return 'balanced'
}

function getSensitivityNumeric(preset: AgentSensitivityPreset) {
  return SENSITIVITY_OPTIONS.find((option) => option.value === preset)?.numeric ?? 0.5
}

function getSensitivityLabel(preset: AgentSensitivityPreset) {
  return SENSITIVITY_OPTIONS.find((option) => option.value === preset)?.label ?? 'Medium - Balanced'
}

function getVoiceLabel(value: string) {
  return VOICE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

function createDetailSeed(agent: AiAgent): DetailFormState {
  return {
    name: agent.name,
    voice: agent.voice,
    personality: agent.personality,
    sensitivity: pickSensitivityPreset(agent.sensitivity),
    greetingMessage: agent.greetingMessage,
    systemPrompt: agent.systemPrompt || DEFAULT_AGENT_PROMPT,
    language: agent.language,
  }
}

function getServiceIds(agent: AiAgent) {
  return agent.assignedServiceIds ?? []
}

function getServiceNames(agent: AiAgent, services: ClinicService[]) {
  const lookup = new Map(services.map((service) => [service.id, service] as const))
  return getServiceIds(agent)
    .map((serviceId) => lookup.get(serviceId))
    .filter((service): service is ClinicService => Boolean(service))
    .map((service) => service.name)
}

function ConversationBubble({ role, content }: { role: string; content: string }) {
  const isAgent = role === 'agent'
  return (
    <div className={cn('flex gap-3', isAgent ? 'justify-start' : 'justify-end')}>
      {isAgent ? (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(15,118,110,0.12)] text-[var(--brand-strong)]">
          <Sparkles className="h-4 w-4" />
        </div>
      ) : null}
      <div className={cn('max-w-[78%] rounded-[18px] border px-4 py-3 text-sm leading-7', isAgent ? 'border-[var(--border-soft)] bg-white/90 text-[var(--text-strong)]' : 'border-[rgba(15,118,110,0.18)] bg-[rgba(15,118,110,0.08)] text-[var(--text-strong)]')}>
        {content}
      </div>
    </div>
  )
}

export function AgentDetailManager({
  agent,
  businessId,
  businessSlug,
  services,
  initialMode,
}: {
  agent: AiAgent
  businessId: string
  businessSlug: string
  services: ClinicService[]
  initialMode: 'configure' | 'test-live'
}) {
  const [currentAgent, setCurrentAgent] = useState(agent)
  const voiceCall = useRealtimeVoice()
  const [mode, setMode] = useState<'configure' | 'test-live'>(initialMode)
  const [testTab, setTestTab] = useState<'voice-call' | 'book-appointment'>('voice-call')
  const [form, setForm] = useState<DetailFormState>(() => createDetailSeed(agent))
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(getServiceIds(agent))
  const [serviceSearch, setServiceSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [bookingSaving, setBookingSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ManagerToast[]>([])
  const [bookingForm, setBookingForm] = useState({
    fullName: 'Jane Smith',
    phone: '(555) 000-0000',
    email: 'jane@example.com',
    dateOfBirth: '',
    serviceId: getServiceIds(agent)[0] ?? services[0]?.id ?? '',
    dateTime: '',
    notes: '',
  })

  useEffect(() => {
    setCurrentAgent(agent)
    setMode(initialMode)
    setForm(createDetailSeed(agent))
    setSelectedServiceIds(getServiceIds(agent))
    setBookingForm((current) => ({
      ...current,
      serviceId: getServiceIds(agent)[0] ?? services[0]?.id ?? '',
    }))
  }, [agent, initialMode, services])

  function pushToast(toast: Omit<ManagerToast, 'id'>) {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, ...toast }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3600)
  }

  const assignedServiceNames = getServiceNames(currentAgent, services)
  const filteredServices = services.filter((service) => {
    const haystack = `${service.name} ${service.description ?? ''} ${service.instructions ?? ''}`.toLowerCase()
    return haystack.includes(serviceSearch.toLowerCase().trim())
  })

  const voiceCallActive =
    voiceCall.status === 'connecting' ||
    voiceCall.status === 'initializing' ||
    voiceCall.status === 'listening' ||
    voiceCall.status === 'thinking' ||
    voiceCall.status === 'speaking'

  async function handleToggleVoiceCall() {
    if (voiceCallActive) {
      voiceCall.disconnect()
      return
    }

    try {
      await voiceCall.connect({
        businessSlug,
        agentId: currentAgent.id,
        language: currentAgent.language,
        onToolCall: async (toolName, args) => {
          const response = await fetch('/api/realtime/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessSlug, toolName, arguments: args }),
          })
          if (!response.ok) {
            throw new Error(await response.text())
          }
          const body = await response.json()
          return body.result
        },
      })
      await voiceCall.startListening()
    } catch (err) {
      pushToast({
        title: 'Could not start voice call',
        message: err instanceof Error ? err.message : 'Check microphone permissions and try again.',
        tone: 'rose',
      })
    }
  }

  async function saveConfiguration() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const saved = await updateAgent(supabase, businessId, currentAgent.id, {
        name: form.name.trim(),
        voice: form.voice,
        personality: form.personality,
        sensitivity: getSensitivityNumeric(form.sensitivity),
        greetingMessage: form.greetingMessage.trim() || currentAgent.greetingMessage,
        systemPrompt: form.systemPrompt.trim() || DEFAULT_AGENT_PROMPT,
        assignedServiceIds: selectedServiceIds,
        templateKey: currentAgent.templateKey ?? null,
        title: currentAgent.title,
        specialty: currentAgent.specialty,
        status: currentAgent.status,
        language: form.language,
        callsHandled: currentAgent.callsHandled,
      })
      setCurrentAgent(saved)
      setForm(createDetailSeed(saved))
      setSelectedServiceIds(getServiceIds(saved))
      pushToast({
        title: 'Agent updated',
        message: `${saved.name} is ready with its updated configuration.`,
        tone: 'emerald',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el agente')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${currentAgent.name}?`)) return
    const supabase = createClient()
    await deleteAgent(supabase, businessId, currentAgent.id)
    window.location.href = '/dashboard/agents'
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) => (current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]))
  }

  function selectAllFiltered() {
    setSelectedServiceIds((current) => {
      const next = new Set(current)
      filteredServices.forEach((service) => next.add(service.id))
      return Array.from(next)
    })
  }

  function clearFiltered() {
    setSelectedServiceIds((current) => current.filter((serviceId) => !filteredServices.some((service) => service.id === serviceId)))
  }

  async function handleBookAppointment(event: FormEvent) {
    event.preventDefault()

    if (!bookingForm.fullName.trim()) {
      pushToast({ title: 'Full name is required', tone: 'rose' })
      return
    }
    if (!bookingForm.serviceId) {
      pushToast({ title: 'Select a service', tone: 'rose' })
      return
    }
    if (!bookingForm.dateTime) {
      pushToast({ title: 'Pick a date and time', tone: 'rose' })
      return
    }

    setBookingSaving(true)
    try {
      const supabase = createClient()
      const patient = await findOrCreatePatient(supabase, businessId, {
        name: bookingForm.fullName.trim(),
        email: bookingForm.email.trim() || null,
        phone: bookingForm.phone.trim() || null,
        dateOfBirth: bookingForm.dateOfBirth || null,
        source: 'manual',
      })

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          agentId: currentAgent.id,
          serviceId: bookingForm.serviceId,
          scheduledAt: new Date(bookingForm.dateTime).toISOString(),
          source: 'manual',
          notes: bookingForm.notes.trim() || null,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Selected time slot is not available')
      }

      pushToast({
        title: 'Appointment booked',
        message: `${bookingForm.fullName.trim()} is on the schedule.`,
        tone: 'emerald',
      })
      setBookingForm((current) => ({
        fullName: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        serviceId: current.serviceId,
        dateTime: '',
        notes: '',
      }))
    } catch (err) {
      pushToast({
        title: 'Could not book appointment',
        message: err instanceof Error ? err.message : 'Something went wrong',
        tone: 'rose',
      })
    } finally {
      setBookingSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button href="/dashboard/agents" variant="secondary" className="h-10 px-4 py-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <SectionEyebrow>Agent detail</SectionEyebrow>
        </div>
        <StatusBadge tone={STATUS_TONE[currentAgent.status]}>{STATUS_LABEL[currentAgent.status]}</StatusBadge>
      </div>

      <SectionHeading
        title={currentAgent.name}
        description="Configure the live voice agent or switch into test mode to validate the call and appointment flow."
        actions={
          <div className="flex flex-wrap gap-2">
            {assignedServiceNames.slice(0, 3).map((serviceName) => (
              <Badge key={serviceName} tone="slate" className="bg-white/90 normal-case tracking-normal">
                {serviceName}
              </Badge>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Calls Handled" value={String(currentAgent.callsHandled)} delta="Across all channels" icon={PhoneCall} tone="teal" />
        <MetricCard label="Assigned Services" value={String(assignedServiceNames.length)} delta="Visible in booking flows" icon={Stethoscope} tone="emerald" />
        <MetricCard label="Voice" value={getVoiceLabel(currentAgent.voice)} delta={currentAgent.personality} icon={Mic} tone="blue" />
        <MetricCard label="Sensitivity" value={getSensitivityLabel(pickSensitivityPreset(currentAgent.sensitivity))} delta="Interrupt handling" icon={Sparkles} tone="amber" />
      </div>

      <Tabs
        items={[
          { label: 'Configure', value: 'configure' },
          { label: 'Test Live', value: 'test-live' },
        ]}
        value={mode}
        onChange={(value) => setMode(value as 'configure' | 'test-live')}
      />

      {mode === 'configure' ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <SurfaceCard className="p-6">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Agent Configuration</div>
                <h2 className="mt-1 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                  Update how this agent behaves on patient calls
                </h2>
              </div>
              <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                {currentAgent.templateKey ? 'Template-linked' : 'Custom'}
              </Badge>
            </div>

            {error ? (
              <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <div className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Agent Name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Select
                  label="Voice"
                  value={form.voice}
                  onChange={(event) => setForm((current) => ({ ...current, voice: event.target.value }))}
                >
                  {VOICE_OPTIONS.map((voice) => (
                    <option key={voice.value} value={voice.value}>
                      {voice.label} - {voice.description}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Personality"
                  value={form.personality}
                  onChange={(event) => setForm((current) => ({ ...current, personality: event.target.value }))}
                >
                  {PERSONALITY_OPTIONS.map((personality) => (
                    <option key={personality} value={personality}>
                      {personality}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Interruption Sensitivity"
                  value={form.sensitivity}
                  onChange={(event) => setForm((current) => ({ ...current, sensitivity: event.target.value as AgentSensitivityPreset }))}
                >
                  {SENSITIVITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.detail}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Language"
                  value={form.language}
                  onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                  hint="Also used as the transcription hint for call logs - leaving this on English will garble non-English transcripts."
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <Textarea
                label="Greeting Message"
                value={form.greetingMessage}
                onChange={(event) => setForm((current) => ({ ...current, greetingMessage: event.target.value }))}
                rows={3}
                hint="First thing the AI says when the call connects."
              />

              <Textarea
                label="System Prompt"
                value={form.systemPrompt}
                onChange={(event) => setForm((current) => ({ ...current, systemPrompt: event.target.value }))}
                rows={10}
                hint="Instructions for how the AI should behave, what it knows, and how it handles calls."
                className="font-mono text-xs"
              />

              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-strong)]">Assigned Services</div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Choose which clinic services this agent is allowed to discuss.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={selectAllFiltered}>
                      Select all
                    </Button>
                    <Button variant="ghost" onClick={clearFiltered}>
                      Clear
                    </Button>
                  </div>
                </div>

                <Input
                  label="Filter services"
                  value={serviceSearch}
                  onChange={(event) => setServiceSearch(event.target.value)}
                  placeholder="Search services..."
                  className="mt-4"
                />

                <div className="mt-4 max-h-[40vh] space-y-3 overflow-y-auto pr-1">
                  {filteredServices.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-[var(--border-soft)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                      No services match your search.
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const active = selectedServiceIds.includes(service.id)
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={cn(
                            'flex w-full items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition',
                            active
                              ? 'border-[rgba(15,118,110,0.28)] bg-[rgba(15,118,110,0.08)]'
                              : 'border-[var(--border-soft)] bg-white/85 hover:bg-white',
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                              active
                                ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                                : 'border-[var(--border-strong)] bg-white text-transparent',
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-semibold text-[var(--text-strong)]">{service.name}</div>
                              <Badge tone={service.active ? 'emerald' : 'slate'} className="bg-white/80 normal-case tracking-normal">
                                {service.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="mt-1 text-sm text-[var(--text-muted)]">
                              {service.description ?? 'No description'} · {service.durationMinutes} min
                            </div>
                          </div>
                          <div className="text-right text-sm text-[var(--text-muted)]">
                            <div className="font-semibold text-[var(--text-strong)]">
                              {service.price != null ? formatCurrency(service.price, service.currency) : 'Contact'}
                            </div>
                            <div>{service.instructions ?? 'No extra instructions'}</div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
                <div className="text-sm text-[var(--text-muted)]">
                  This configuration updates the live agent used on the website and in call testing.
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => setMode('test-live')}>
                    Test This Agent
                  </Button>
                  <Button onClick={() => void saveConfiguration()} disabled={saving} className="min-w-[180px]">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <div className="space-y-6">
            <SurfaceCard className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Live Snapshot</div>
              <h3 className="mt-2 text-xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{currentAgent.name}</h3>
              <div className="mt-1 text-sm text-[var(--text-muted)]">{currentAgent.title ?? currentAgent.specialty ?? 'Clinic agent'}</div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge tone={STATUS_TONE[currentAgent.status]}>{STATUS_LABEL[currentAgent.status]}</StatusBadge>
                <Badge tone="slate" className="bg-white/85 normal-case tracking-normal">
                  {getVoiceLabel(currentAgent.voice)}
                </Badge>
                <Badge tone="slate" className="bg-white/85 normal-case tracking-normal">
                  {getSensitivityLabel(pickSensitivityPreset(currentAgent.sensitivity))}
                </Badge>
              </div>

              <div className="mt-6 space-y-3 rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,240,231,0.78))] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Selected Services</div>
                <div className="flex flex-wrap gap-2">
                  {assignedServiceNames.length === 0 ? (
                    <div className="text-sm text-[var(--text-muted)]">No services selected yet.</div>
                  ) : (
                    assignedServiceNames.map((serviceName) => (
                      <Badge key={serviceName} tone="teal" className="bg-white/90 normal-case tracking-normal">
                        {serviceName}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-[var(--text-muted)]">
                <div className="flex items-center justify-between gap-4">
                  <span>Calls handled</span>
                  <span className="font-semibold text-[var(--text-strong)]">{currentAgent.callsHandled}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Voice</span>
                  <span className="font-semibold text-[var(--text-strong)]">{getVoiceLabel(currentAgent.voice)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Language</span>
                  <span className="font-semibold text-[var(--text-strong)]">{currentAgent.language.toUpperCase()}</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Prompt Preview</div>
              <p className="mt-3 text-sm leading-7 text-[var(--text-strong)]">{form.greetingMessage}</p>
              <div className="mt-4 rounded-[22px] border border-[var(--border-soft)] bg-white/85 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">System Prompt</div>
                <p className="mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-[var(--text-muted)]">
                  {form.systemPrompt}
                </p>
              </div>
            </SurfaceCard>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <SurfaceCard className="p-6">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Test Live</div>
                <h2 className="mt-1 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                  Talk to the agent in real time
                </h2>
              </div>
              <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                Active voice test
              </Badge>
            </div>

            <Tabs
              items={[
                { label: 'Voice Call', value: 'voice-call' },
                { label: 'Book Appointment', value: 'book-appointment' },
              ]}
              value={testTab}
              onChange={(value) => setTestTab(value as 'voice-call' | 'book-appointment')}
            />

            {testTab === 'voice-call' ? (
              <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
                <SurfaceCard className="p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Live Test</div>
                  <div className="mt-4 rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,240,231,0.78))] p-5 text-center">
                    <div className="text-sm font-semibold text-[var(--text-strong)]">{currentAgent.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      {getVoiceLabel(currentAgent.voice)} voice · {currentAgent.personality.toLowerCase()}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleToggleVoiceCall()}
                      disabled={voiceCall.status === 'connecting' || voiceCall.status === 'initializing'}
                      className={cn(
                        'mx-auto mt-6 grid h-24 w-24 place-items-center rounded-full border text-white shadow-[0_24px_48px_-32px_rgba(15,118,110,0.7)] transition disabled:opacity-70',
                        voiceCallActive
                          ? 'border-[rgba(225,29,72,0.28)] bg-[linear-gradient(135deg,#e11d48,#be123c)]'
                          : 'border-[rgba(15,118,110,0.22)] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))]'
                      )}
                    >
                      {voiceCall.status === 'connecting' || voiceCall.status === 'initializing' ? (
                        <Loader2 className="h-10 w-10 animate-spin" />
                      ) : voiceCallActive ? (
                        <PhoneOff className="h-10 w-10" />
                      ) : (
                        <Mic className="h-10 w-10" />
                      )}
                    </button>
                    <div className="mt-4 text-sm font-semibold text-[var(--text-strong)]">
                      {voiceCall.status === 'connecting' || voiceCall.status === 'initializing'
                        ? 'Connecting...'
                        : voiceCall.status === 'listening'
                          ? 'Listening - tap to end'
                          : voiceCall.status === 'thinking'
                            ? 'Thinking...'
                            : voiceCall.status === 'speaking'
                              ? 'Speaking - tap to end'
                              : voiceCall.status === 'error'
                                ? 'Call failed'
                                : 'Ready to test'}
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {voiceCall.error ? voiceCall.error : 'Click the mic to start a call and stream the transcript live.'}
                    </p>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] p-4 text-sm text-[var(--text-muted)]">
                    <div className="font-semibold text-[var(--text-strong)]">Testing tips</div>
                    <ul className="mt-3 space-y-2">
                      <li>• Allow microphone access when prompted.</li>
                      <li>• Ask about services, hours, or pricing.</li>
                      <li>• Try appointment booking end-to-end.</li>
                    </ul>
                  </div>
                </SurfaceCard>

                <SurfaceCard className="p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                        Conversation Transcript
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">Transcript appears here during the call.</p>
                    </div>
                    <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                      {assignedServiceNames.length} services
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {voiceCall.messages.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)]">
                        {voiceCallActive ? 'Listening for the first thing you say...' : 'No conversation yet.'}
                      </p>
                    ) : (
                      voiceCall.messages.map((message) => (
                        <ConversationBubble key={message.id} role={message.role} content={message.content} />
                      ))
                    )}
                  </div>
                </SurfaceCard>
              </div>
            ) : (
              <SurfaceCard className="p-5">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] pb-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Book Appointment</div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Manually create an appointment for a patient.</p>
                  </div>
                  <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                    {assignedServiceNames.length > 0 ? `${assignedServiceNames.length} services` : 'No services'}
                  </Badge>
                </div>

                <form onSubmit={(event) => void handleBookAppointment(event)} className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Full Name"
                      value={bookingForm.fullName}
                      onChange={(event) => setBookingForm((current) => ({ ...current, fullName: event.target.value }))}
                    />
                    <Input
                      label="Phone"
                      value={bookingForm.phone}
                      onChange={(event) => setBookingForm((current) => ({ ...current, phone: event.target.value }))}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Email"
                      value={bookingForm.email}
                      onChange={(event) => setBookingForm((current) => ({ ...current, email: event.target.value }))}
                    />
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={bookingForm.dateOfBirth}
                      onChange={(event) => setBookingForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Select
                      label="Service"
                      value={bookingForm.serviceId}
                      onChange={(event) => setBookingForm((current) => ({ ...current, serviceId: event.target.value }))}
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Date & Time"
                      type="datetime-local"
                      value={bookingForm.dateTime}
                      onChange={(event) => setBookingForm((current) => ({ ...current, dateTime: event.target.value }))}
                    />
                  </div>

                  <Textarea
                    label="Notes"
                    value={bookingForm.notes}
                    onChange={(event) => setBookingForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={4}
                    hint="Any additional notes or patient concerns."
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
                    <div className="text-sm text-[var(--text-muted)]">
                      The booking form mirrors the patient-facing appointment flow.
                    </div>
                    <Button type="submit" disabled={bookingSaving}>
                      {bookingSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        <>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Book Appointment
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </SurfaceCard>
            )}
          </SurfaceCard>

          <div className="space-y-6">
            <SurfaceCard className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Agent Summary</div>
              <h3 className="mt-2 text-xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{currentAgent.name}</h3>
              <div className="mt-1 text-sm text-[var(--text-muted)]">{currentAgent.title ?? currentAgent.specialty ?? 'Clinic agent'}</div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge tone={STATUS_TONE[currentAgent.status]}>{STATUS_LABEL[currentAgent.status]}</StatusBadge>
                <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                  {getVoiceLabel(currentAgent.voice)}
                </Badge>
                <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                  {getSensitivityLabel(pickSensitivityPreset(currentAgent.sensitivity))}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-[var(--text-muted)]">
                <div className="flex items-center justify-between gap-4">
                  <span>Calls handled</span>
                  <span className="font-semibold text-[var(--text-strong)]">{currentAgent.callsHandled}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Assigned services</span>
                  <span className="font-semibold text-[var(--text-strong)]">{assignedServiceNames.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Language</span>
                  <span className="font-semibold text-[var(--text-strong)]">{currentAgent.language.toUpperCase()}</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Assigned Services</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {assignedServiceNames.length === 0 ? (
                  <div className="text-sm text-[var(--text-muted)]">No services assigned yet.</div>
                ) : (
                  assignedServiceNames.map((serviceName) => (
                    <Badge key={serviceName} tone="teal" className="bg-white/90 normal-case tracking-normal">
                      {serviceName}
                    </Badge>
                  ))
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Delete Agent</div>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                Removing this agent will keep the rest of the clinic setup intact, but the voice workflow will no longer be available.
              </p>
              <Button variant="danger" className="mt-5 w-full" onClick={() => void handleDelete()}>
                Delete Agent
              </Button>
            </SurfaceCard>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex w-[min(380px,calc(100vw-1.5rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            tone={toast.tone ?? 'teal'}
            onClose={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  )
}
